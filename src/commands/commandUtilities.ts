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
	public i18nParamsExample = 'dashboard';
	public providesPreview = false;

	constructor(private readonly appId: string) {}

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
			await handler.sendNoPermission();
			return;
		}
		const [subcommand] = context.getArguments();

		switch (subcommand?.toLowerCase()) {
			case SpamMonitorParam.DASHBOARD:
				await handler.openDashboard(context, this.appId);
				break;
			default:
				await handler.sendHelp();
				break;
		}
	}
}
