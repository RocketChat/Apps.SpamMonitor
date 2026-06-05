import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SPAMMING_LEVEL_LABELS } from '../definition/spamlevel';
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
		const msg = this.modify
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
		await msg;
	}

	public async listFlaggedUsers(): Promise<void> {
		const records = await UserStatusStore.getAll(this.read);

		if (!records.length) {
			await this.notify(slashNotifications.NO_FLAGGED_USERS);
			return;
		}

		records.sort((a, b) => {
			if (b.spammingLevel !== a.spammingLevel) {
				return b.spammingLevel - a.spammingLevel;
			}
			return a.username.localeCompare(b.username);
		});

		const lines = records.map((r) => {
			const label =
				SPAMMING_LEVEL_LABELS[r.spammingLevel] ??
				String(r.spammingLevel);
			const cooldownStr =
				r.cooldownUntil > 0 && Date.now() < r.cooldownUntil
					? ` | cooldown until ${new Date(r.cooldownUntil).toISOString().slice(0, 16).replace('T', ' ')}`
					: '';
			return `@${r.username} — **${label}** (${r.totalFlags} flag${r.totalFlags === 1 ? '' : 's'})${cooldownStr}`;
		});

		const header = `*Flagged Users (${records.length})*\n`;
		await this.notify(header + lines.join('\n'));
	}

	public async sendHelp(): Promise<void> {
		await this.notify(slashCommandHelp.HELP);
	}

	public async sendNoPermission(): Promise<void> {
		await this.notify(slashNotifications.NO_PERMISSION);
	}
}
