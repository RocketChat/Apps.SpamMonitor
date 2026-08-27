import { CachedMessage } from '../../definition/messageCache';

export class MessageCache {
	private cache: Map<string, CachedMessage[]> = new Map();
	private readonly maxPerUser = 30;
	private readonly maxTotalUsers = 500;
	private rateTracker: Map<string, number[]> = new Map();
	private readonly maxRateEntries = 60;

	public add(
		userId: string,
		hash: string,
		roomId: string,
		normalized: string,
		hasUrl: boolean,
		domains: string[],
		messageId?: string,
	): void {
		if (messageId) {
			const entries = this.cache.get(userId);
			if (entries) {
				const idx = entries.findIndex((e) => e.messageId === messageId);
				if (idx !== -1) {
					entries.splice(idx, 1);
					entries.push({
						hash,
						messageId,
						roomId,
						timestamp: Date.now(),
						normalized,
						hasUrl,
						domains,
					});
					return;
				}
			}
		}

		const entries = this.cache.get(userId) ?? [];
		entries.push({
			hash,
			messageId,
			roomId,
			timestamp: Date.now(),
			normalized,
			hasUrl,
			domains,
		});
		if (entries.length > this.maxPerUser) {
			entries.shift();
		}
		this.cache.set(userId, entries);

		if (this.cache.size > this.maxTotalUsers) {
			this.evictLruUser();
		}
	}

	public isEditedMessage(userId: string, messageId: string): boolean {
		return (
			this.cache.get(userId)?.some((e) => e.messageId === messageId) ??
			false
		);
	}

	public hasExactDuplicate(
		userId: string,
		hash: string,
		windowMs: number,
	): boolean {
		return this.getRecent(userId, windowMs).some((e) => e.hash === hash);
	}

	public crossChannelCount(
		userId: string,
		hash: string,
		currentRoomId: string,
		windowMs: number,
	): number {
		const rooms = new Set<string>([currentRoomId]);
		for (const entry of this.getRecent(userId, windowMs)) {
			if (entry.hash === hash) {
				rooms.add(entry.roomId);
			}
		}
		return rooms.size;
	}

	public getFuzzyChannels(
		userId: string,
		normalized: string,
		currentRoomId: string,
		windowMs: number,
		similarityFn: (a: string, b: string) => number,
		threshold: number,
	): number {
		const rooms = new Set<string>();
		for (const entry of this.getRecent(userId, windowMs)) {
			if (
				entry.roomId !== currentRoomId &&
				entry.normalized.length >= 10
			) {
				if (similarityFn(normalized, entry.normalized) >= threshold) {
					rooms.add(entry.roomId);
				}
			}
		}
		if (rooms.size > 0) {
			rooms.add(currentRoomId);
		}
		return rooms.size;
	}

	public trackMessage(userId: string): void {
		const timestamps = this.rateTracker.get(userId) ?? [];
		timestamps.push(Date.now());
		if (timestamps.length > this.maxRateEntries) {
			timestamps.shift();
		}
		this.rateTracker.set(userId, timestamps);
		if (this.rateTracker.size > this.maxTotalUsers) {
			this.evictLruUser();
		}
	}

	public getMessageRate(userId: string, windowMs: number): number {
		const timestamps = this.rateTracker.get(userId);
		if (!timestamps) {
			return 0;
		}
		const cutoff = Date.now() - windowMs;
		return timestamps.filter((t) => t >= cutoff).length;
	}

	public getDistinctRooms(userId: string, windowMs: number): number {
		const rooms = new Set(
			this.getRecent(userId, windowMs).map((e) => e.roomId),
		);
		return rooms.size;
	}

	public getUrlMessageCount(userId: string, windowMs: number): number {
		return this.getRecent(userId, windowMs).filter((e) => e.hasUrl).length;
	}

	public clearUser(userId: string): void {
		this.cache.delete(userId);
		this.rateTracker.delete(userId);
	}

	public clearStale(maxAgeMs: number): void {
		const cutoff = Date.now() - maxAgeMs;
		for (const [userId, entries] of this.cache) {
			const fresh = entries.filter((e) => e.timestamp >= cutoff);
			if (fresh.length === 0) {
				this.cache.delete(userId);
			} else {
				this.cache.set(userId, fresh);
			}
		}
		for (const [userId, timestamps] of this.rateTracker) {
			const fresh = timestamps.filter((t) => t >= cutoff);
			if (fresh.length === 0) {
				this.rateTracker.delete(userId);
			} else {
				this.rateTracker.set(userId, fresh);
			}
		}
	}

	private evictLruUser(): void {
		let oldestUser = '';
		let oldestTime = Infinity;
		for (const [userId, entries] of this.cache) {
			const latest =
				entries.length > 0 ? entries[entries.length - 1].timestamp : 0;
			if (latest < oldestTime) {
				oldestTime = latest;
				oldestUser = userId;
			}
		}
		if (oldestUser) {
			this.cache.delete(oldestUser);
			this.rateTracker.delete(oldestUser);
		}
	}

	private getRecent(userId: string, windowMs: number): CachedMessage[] {
		const entries = this.cache.get(userId);
		if (!entries) {
			return [];
		}
		const cutoff = Date.now() - windowMs;
		const recent = entries.filter((e) => e.timestamp >= cutoff);
		if (recent.length !== entries.length) {
			if (recent.length === 0) {
				this.cache.delete(userId);
				this.rateTracker.delete(userId);
			} else {
				this.cache.set(userId, recent);
			}
		}
		return recent;
	}
}
