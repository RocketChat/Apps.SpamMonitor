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

		if (!sender.roles?.includes('admin')) {
			await handler.sendNoPermission();
			return;
		}

		const [subcommand, ...rest] = context.getArguments();
		if (subcommand?.toLowerCase() !== SpamMonitorParam.LIST) {
			await handler.sendHelp();
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
