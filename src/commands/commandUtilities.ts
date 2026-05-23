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
	public i18nParamsExample = 'list';
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
		const roles = sender.roles || [];
		if (!roles.includes('admin')) {
			await handler.sendHelp();
			return;
		}
		const [subcommand] = context.getArguments();

		switch (subcommand?.toLowerCase()) {
			case SpamMonitorParam.LIST:
				await handler.listFlaggedUsers();
				break;
			default:
				await handler.sendNoPermission();
				break;
		}
	}
}
