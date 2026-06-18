import {
	IHttp,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	ISlashCommand,
	SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';
import { SpamMonitorHandler } from '../handlers/handler';
import { SpamMonitorParam } from '../enums/commandUtilities';
import { slashCommandHelp, slashNotifications } from '../enums/notifications';
import { ADMIN_CHANNEL_NAME } from '../constants/config';

export class SpamMonitorCommand implements ISlashCommand {
	public command = 'spammonitor';
	public i18nDescription = 'SpamMonitor_Command_Description';
	public i18nParamsExample = 'list all | list timeout | list <Level>';
	public providesPreview = false;

	public async executor(
		context: SlashCommandContext,
		read: IRead,
		modify: IModify,
		http: IHttp,
		persistence: IPersistence,
	): Promise<void> {
		const sender = context.getSender();
		const room = context.getRoom();
		const handler = new SpamMonitorHandler(
			sender,
			room,
			read,
			modify,
			http,
			persistence,
		);

		if (room.slugifiedName !== ADMIN_CHANNEL_NAME) {
			await handler.sendNotification(
				slashNotifications.ADMIN_CHANNEL_ONLY,
			);
			return;
		}

		const roles = sender.roles || [];
		if (!roles.includes('admin')) {
			await handler.sendNotification(slashNotifications.NO_PERMISSION);
			return;
		}

		const [subcommand, ...rest] = context.getArguments();
		if (subcommand?.toLowerCase() !== SpamMonitorParam.LIST) {
			await handler.sendNotification(slashCommandHelp.HELP);
			return;
		}

		const filter = rest.join(' ').toLowerCase().trim();
		switch (filter) {
			case SpamMonitorParam.ALL:
			case '':
				await handler.listAll();
				break;
			case SpamMonitorParam.TIMEOUT:
				await handler.listTimeout();
				break;
			case SpamMonitorParam.ADMIN_REVIEW:
				await handler.listAdminReview();
				break;
			default:
				await handler.listByLevel(filter);
				break;
		}
	}
}
