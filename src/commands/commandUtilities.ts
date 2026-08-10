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
import { RoomInteractionStorage } from '../persistence/roomInteraction';

export class SpamMonitorCommand implements ISlashCommand {
	public command = 'spammonitor';
	public i18nDescription = 'SpamMonitor_Command_Description';
	public i18nParamsExample =
		'list all | list timeout | list <Level> | manage <username> | level';
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
		const triggerId = context.getTriggerId();

		const roomInteractionStorage = new RoomInteractionStorage(
			persistence,
			read.getPersistenceReader(),
			sender.id,
		);
		roomInteractionStorage.storeInteractionRoomId(room.id);

		const handler = new SpamMonitorHandler(
			sender,
			room,
			read,
			modify,
			http,
			persistence,
			this.appId,
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

		switch (subcommand?.toLowerCase()) {
			case SpamMonitorParam.LIST: {
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
				break;
			}
			case SpamMonitorParam.MANAGE: {
				const username = rest[0]?.replace(/^@/, '').trim();
				if (!triggerId) {
					await handler.sendNotification(
						slashNotifications.MANAGE_MISSING_USERNAME,
					);
					return;
				}
				await handler.manageUser(username, triggerId);
				break;
			}

			case SpamMonitorParam.LEVEL: {
				if (!triggerId) {
					await handler.sendNotification(
						slashNotifications.LEVEL_MISSING_LEVEL,
					);
					return;
				}
				await handler.configureLevels(triggerId);
				break;
			}
			case SpamMonitorParam.SCHEDULE: {
				if (!triggerId) {
					await handler.sendNotification(
						slashNotifications.SCHEDULE_MISSING_TRIGGER,
					);
					return;
				}
				await handler.scheduleReport(triggerId);
				break;
			}

			default:
				await handler.sendNotification(slashCommandHelp.HELP);
				break;
		}
	}
}
