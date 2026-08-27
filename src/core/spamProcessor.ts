import { createHash } from 'crypto';
import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { MessageCache } from './cache/messageCache';
import { UserStatusStore } from '../persistence/userStatusStore';
import { AnalysisResult, SpamConfig } from '../definition/spamProcessor';
import { LevelConfigStore } from '../persistence/levelConfigStore';

export class SpamProcessor {
	constructor(
		private readonly cache: MessageCache,
		private config: SpamConfig,
	) {}

	public isNewUser(user: IUser): boolean {
		if (!user.createdAt) {
			return false;
		}
		return (
			Date.now() - new Date(user.createdAt).getTime() <
			this.config.monitoringWindowMs
		);
	}

	public updateConfig(config: SpamConfig): void {
		this.config = { ...config };
	}

	public async analyzeMessage(
		message: IMessage,
		read: IRead,
		persistence: IPersistence,
	): Promise<AnalysisResult> {
		const text = message.text || '';
		const userId = message.sender.id;
		const username = message.sender.username;
		const roomId = message.room.id;
		const messageId = message.id;

		const normalized = this.normalize(text);
		const hash = this.hashText(normalized);
		const { hasUrl, domains } = this.extractUrlInfo(text);

		this.cache.trackMessage(userId);

		const existing = await UserStatusStore.get(read, userId);
		const prevLevel = existing?.spammingLevel ?? 0;

		// Edit-awareness
		if (messageId && this.cache.isEditedMessage(userId, messageId)) {
			this.cache.add(
				userId,
				hash,
				roomId,
				normalized,
				hasUrl,
				domains,
				messageId,
			);
			return {
				flagged: false,
				levelChanged: false,
				trigger: 'edit',
				record: null,
			};
		}

		const flag = async (trigger: string): Promise<AnalysisResult> => {
			const configs = await LevelConfigStore.getAll(read);
			const record = await UserStatusStore.escalate(
				read,
				persistence,
				userId,
				username,
				configs,
			);
			this.cache.add(
				userId,
				hash,
				roomId,
				normalized,
				hasUrl,
				domains,
				messageId,
			);
			const levelChanged = record.spammingLevel > prevLevel;
			return { flagged: true, levelChanged, trigger, record };
		};

		// Gate 1 — Exact duplicate
		if (
			this.cache.hasExactDuplicate(
				userId,
				hash,
				this.config.slidingWindowMs,
			)
		) {
			return flag('duplicate');
		}

		// Gate 2 — Fuzzy / polymorphic
		if (normalized.length >= 10) {
			const tokenCount = normalized
				.split(' ')
				.filter((t) => t.length >= 3).length;
			const simThreshold =
				tokenCount < 5 ? 0.85 : tokenCount < 8 ? 0.8 : 0.75;
			const fuzzyChannels = this.cache.getFuzzyChannels(
				userId,
				normalized,
				roomId,
				this.config.slidingWindowMs,
				(a, b) =>
					this.cosineSimilarity(this.tokenize(a), this.tokenize(b)),
				simThreshold,
			);
			if (fuzzyChannels >= this.config.crossChannelThreshold) {
				return flag('polymorphic-spam');
			}
		}

		// Gate 3 — Cross-channel exact
		const crossCount = this.cache.crossChannelCount(
			userId,
			hash,
			roomId,
			this.config.slidingWindowMs,
		);
		if (crossCount >= this.config.crossChannelThreshold) {
			return flag('cross-channel');
		}

		// Gate 4 — Rate flood
		const rate30s = this.cache.getMessageRate(userId, 30_000);
		const rate2m = this.cache.getMessageRate(userId, 120_000);
		if (
			rate30s >= this.config.rateShortBurst ||
			rate2m >= this.config.rateSustained
		) {
			return flag('rate-flood');
		}

		// Gate 5 — Room spread
		const roomSpread = this.cache.getDistinctRooms(userId, 120_000);
		if (
			roomSpread >= this.config.crossChannelThreshold &&
			rate2m >= this.config.crossChannelThreshold
		) {
			return flag('room-spread');
		}

		// Gate 6 — URL spam
		if (hasUrl) {
			const urlCount = this.cache.getUrlMessageCount(userId, 120_000);
			if (urlCount >= 3 && roomSpread >= 2) {
				return flag('url-spam');
			}
		}

		this.cache.add(
			userId,
			hash,
			roomId,
			normalized,
			hasUrl,
			domains,
			messageId,
		);

		return {
			flagged: false,
			levelChanged: false,
			trigger: 'none',
			record: existing,
		};
	}

	// Text utilities

	private normalize(text: string): string {
		return text
			.toLowerCase()
			.replace(/[\u200B-\u200F\u2060-\u206F]/g, '')
			.replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
			.replace(/https?:\/\/\S+/g, '')
			.replace(/[.,!?;:()\-#@]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	private tokenize(text: string): Map<string, number> {
		const freq = new Map<string, number>();
		for (const token of text.split(' ')) {
			if (token.length >= 3) {
				freq.set(token, (freq.get(token) ?? 0) + 1);
			}
		}
		return freq;
	}

	private cosineSimilarity(
		a: Map<string, number>,
		b: Map<string, number>,
	): number {
		if (a.size === 0 || b.size === 0) {
			return 0;
		}
		let dot = 0,
			normA = 0,
			normB = 0;
		for (const [k, v] of a) {
			dot += v * (b.get(k) ?? 0);
			normA += v * v;
		}
		for (const [, v] of b) {
			normB += v * v;
		}
		if (normA === 0 || normB === 0) {
			return 0;
		}
		return dot / (Math.sqrt(normA) * Math.sqrt(normB));
	}

	private hashText(text: string): string {
		return createHash('sha256')
			.update(text.toLowerCase().trim().replace(/\s+/g, ' '))
			.digest('hex');
	}

	private extractUrlInfo(text: string): {
		hasUrl: boolean;
		domains: string[];
	} {
		const urlRegex = /https?:\/\/([^/\s]+)/g;
		const domains: string[] = [];
		let match: RegExpExecArray | null;
		while ((match = urlRegex.exec(text)) !== null) {
			domains.push(match[1].toLowerCase());
		}
		return { hasUrl: domains.length > 0, domains };
	}
}
