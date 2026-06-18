import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
	SpammingLevel,
	SPAMMING_LEVEL_LABELS,
	UserSpamRecord,
} from '../definition/spamlevel';
import { UserStatusStore } from '../persistence/userStatusStore';
import { slashCommandHelp, slashNotifications } from '../enums/notifications';
export class SpamMonitorHandler {
	constructor(
		private readonly sender: IUser,
		private readonly room: IRoom,
		private readonly read: IRead,
		private readonly modify: IModify,
		private readonly http: IHttp,
		private readonly persis: IPersistence,
	) {}

	private async notify(text: string): Promise<void> {
		await this.modify
			.getNotifier()
			.notifyUser(
				this.sender,
				this.modify
					.getCreator()
					.startMessage()
					.setRoom(this.room)
					.setText(text)
					.getMessage(),
			);
	}

	private buildSummary(records: UserSpamRecord[]): string {
		const now = Date.now();
		const count = (level: SpammingLevel) =>
			records.filter((r) => r.spammingLevel === level).length;

		const total = records.length;
		const monitored = count(SpammingLevel.Monitored);
		const restricted = count(SpammingLevel.Restricted);
		const suspended = count(SpammingLevel.Suspended);
		const adminReview = count(SpammingLevel.AdminReview);
		const timedOut = records.filter(
			(r) => r.cooldownUntil > 0 && now < r.cooldownUntil,
		).length;

		return (
			`Total flagged: *${total}* | ` +
			`Monitored: *${monitored}* | ` +
			`Restricted: *${restricted}* | ` +
			`Suspended: *${suspended}* | ` +
			`Pending review: *${adminReview}* | ` +
			`In timeout: *${timedOut}*`
		);
	}

	private formatRow(r: UserSpamRecord): string {
		const label =
			SPAMMING_LEVEL_LABELS[r.spammingLevel] ?? String(r.spammingLevel);
		const now = Date.now();
		const cooldownStr =
			r.cooldownUntil > 0 && now < r.cooldownUntil
				? ` | timeout until ${new Date(r.cooldownUntil)
						.toISOString()
						.slice(0, 16)
						.replace('T', ' ')} UTC`
				: '';
		return `@${r.username} — *${label}* ${cooldownStr}`;
	}

	private async renderList(
		records: UserSpamRecord[],
		title: string,
		allRecords: UserSpamRecord[],
		emptyMsg: string,
	): Promise<void> {
		if (!records.length) {
			await this.notify(emptyMsg);
			return;
		}

		const summary = this.buildSummary(allRecords);
		const rows = records.map((r) => this.formatRow(r)).join('\n');
		await this.notify(`${summary}\n\n*${title}*\n${rows}`);
	}
	private async listByLevelEnum(
		level: SpammingLevel,
		title: string,
	): Promise<void> {
		const all = await UserStatusStore.getAll(this.read);
		const filtered = all
			.filter((r) => r.spammingLevel === level)
			.sort((a, b) => a.username.localeCompare(b.username));
		await this.renderList(
			filtered,
			`${title} Users`,
			all,
			slashNotifications.NO_FLAGGED_USERS_FILTER(title),
		);
	}
	public async listAll(): Promise<void> {
		const records = await UserStatusStore.getAll(this.read);
		const sorted = [...records].sort((a, b) =>
			b.spammingLevel !== a.spammingLevel
				? b.spammingLevel - a.spammingLevel
				: a.username.localeCompare(b.username),
		);
		await this.renderList(
			sorted,
			'All Flagged Users',
			records,
			slashNotifications.NO_FLAGGED_USERS,
		);
	}

	public async listAdminReview(): Promise<void> {
		return this.listByLevelEnum(
			SpammingLevel.AdminReview,
			'Pending Admin Review',
		);
	}

	public async listByLevel(levelName: string): Promise<void> {
		const matchable = (
			Object.entries(SPAMMING_LEVEL_LABELS) as [string, string][]
		).filter(([key]) => Number(key) !== SpammingLevel.AdminReview);
		const matched = matchable.find(
			([, label]) => label.toLowerCase() === levelName.toLowerCase(),
		);
		if (!matched) {
			const valid = matchable.map(([, label]) => label).join(', ');
			await this.notify(
				`Unknown level *${levelName}*. Valid levels: ${valid}.\n` +
					`For admin review users, use \`list review\`.`,
			);
			return;
		}
		return this.listByLevelEnum(
			Number(matched[0]) as SpammingLevel,
			matched[1],
		);
	}

	public async listTimeout(): Promise<void> {
		const records = await UserStatusStore.getAll(this.read);
		const now = Date.now();
		const filtered = records
			.filter((r) => r.cooldownUntil > 0 && now < r.cooldownUntil)
			.sort((a, b) => a.cooldownUntil - b.cooldownUntil);

		await this.renderList(
			filtered,
			'Users in Active Timeout',
			records,
			slashNotifications.NO_FLAGGED_USERS_FILTER('active timeout'),
		);
	}

	public async sendNotification(text: string): Promise<void> {
		await this.notify(text);
	}
}
