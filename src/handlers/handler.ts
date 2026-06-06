import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { slashCommandHelp, slashNotifications } from '../enums/notifications';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { buildDashboardModal } from '../modal/dashboardModal';

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

	public async openDashboard(
		context: SlashCommandContext,
		appId: string,
	): Promise<void> {
		const triggerId = context.getTriggerId();
		if (!triggerId) {
			await this.notify('Could not open dashboard. Try again.');
			return;
		}
		const modal = await buildDashboardModal(this.read, appId);
		await this.modify
			.getUiController()
			.openSurfaceView(modal, { triggerId }, this.sender);
	}

	public async sendHelp(): Promise<void> {
		await this.notify(slashCommandHelp.HELP);
	}

	public async sendNoPermission(): Promise<void> {
		await this.notify(slashNotifications.NO_PERMISSION);
	}
}
