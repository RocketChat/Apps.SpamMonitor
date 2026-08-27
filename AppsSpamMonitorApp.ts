import {
	IAppAccessors,
	IAppInstallationContext,
	IAppUninstallationContext,
	IConfigurationExtend,
	IConfigurationModify,
	IEnvironmentRead,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import {
	IMessage,
	IPostMessageSent,
	IPreMessageSentPrevent,
} from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import {
	IUIKitResponse,
	UIKitBlockInteractionContext,
	UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitInteractionHandler } from '@rocket.chat/apps-engine/definition/uikit/IUIKitActionHandler';
import { SpamProcessor } from './src/core/spamProcessor';
import { MessageCache } from './src/core/cache/messageCache';
import { SpamMonitorCommand } from './src/commands/commandUtilities';
import { APP_SETTINGS } from './src/config/settings';
import { AppSetting } from './src/enums/settings';
import { SpamConfig } from './src/definition/spamProcessor';
import { RestrictionManager } from './src/core/restrictionsManager';
import { UserStatusStore } from './src/persistence/userStatusStore';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AdminChannelMessages } from './src/lib/translations/locals/en';
import {
	ADMIN_CHANNEL_DISPLAY_NAME,
	ADMIN_CHANNEL_NAME,
	MS_PER_DAY,
	MS_PER_SECOND,
} from './src/constants/config';
import { ViewSubmitHandler } from './src/handlers/viewSubmitHandler';
import { BlockActionHandler } from './src/handlers/blockActionHandler';
import { LevelConfigStore } from './src/persistence/levelConfigStore';
import {
	DAILY_REPORT_JOB_ID,
	ScheduledReporter,
} from './src/core/schedulereport';
import { IJobContext } from '@rocket.chat/apps-engine/definition/scheduler';
import { ScheduleStore } from './src/persistence/scheduleReports/scheduleStore';
import { WhitelistStore } from './src/persistence/whiteListStore';

export class AppsSpamMonitorApp
	extends App
	implements
		IPreMessageSentPrevent,
		IPostMessageSent,
		IUIKitInteractionHandler
{
	private processor: SpamProcessor | null = null;
	private cache: MessageCache;

	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async initialize(
		configurationExtend: IConfigurationExtend,
		environmentRead: IEnvironmentRead,
	): Promise<void> {
		this.cache = new MessageCache();
		await super.initialize(configurationExtend, environmentRead);
	}

	protected async extendConfiguration(
		configuration: IConfigurationExtend,
	): Promise<void> {
		await Promise.all(
			APP_SETTINGS.map((setting) =>
				configuration.settings.provideSetting(setting),
			),
		);
		await configuration.slashCommands.provideSlashCommand(
			new SpamMonitorCommand(this.getID()),
		);

		await configuration.scheduler.registerProcessors([
			{
				id: DAILY_REPORT_JOB_ID,
				processor: async (
					_jobContext: IJobContext,
					read: IRead,
					modify: IModify,
					http: IHttp,
					persis: IPersistence,
				) => {
					try {
						await ScheduledReporter.sendDailyReport(
							read,
							modify,
							http,
							persis,
							ADMIN_CHANNEL_NAME,
						);
					} catch (err) {
						this.getLogger().error(
							'[SpamMonitor] Scheduled report job failed:',
							err,
						);
					}
				},
			},
		]);
	}

	public async onEnable(
		environment: IEnvironmentRead,
		configurationModify: IConfigurationModify,
	): Promise<boolean> {
		await this.loadSettings(environment);
		try {
			const read = this.getAccessors().reader;
			const existing = await ScheduleStore.get(read);
			if (existing) {
				await configurationModify.scheduler
					.cancelJob(DAILY_REPORT_JOB_ID)
					.catch(() => {});
				await configurationModify.scheduler.scheduleRecurring({
					id: DAILY_REPORT_JOB_ID,
					interval: existing.cronExpression,
					skipImmediate: true,
				});
			}
		} catch (err) {
			this.getLogger().error(
				'[SpamMonitor] Failed to re-arm schedule on enable:',
				err,
			);
		}
		return true;
	}

	public async onInstall(
		context: IAppInstallationContext,
		read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		const installer = context.user;
		const appUser = await read.getUserReader().getAppUser();
		if (!appUser) {
			return;
		}

		let room = await read.getRoomReader().getByName(ADMIN_CHANNEL_NAME);
		if (!room) {
			const roomBuilder = modify
				.getCreator()
				.startRoom()
				.setDisplayName(ADMIN_CHANNEL_DISPLAY_NAME)
				.setSlugifiedName(ADMIN_CHANNEL_NAME)
				.setType(RoomType.PRIVATE_GROUP)
				.setCreator(appUser)
				.setMembersToBeAddedByUsernames([installer.username]);

			const roomId = await modify.getCreator().finish(roomBuilder);
			room = await read.getRoomReader().getById(roomId);
		}

		if (room) {
			const msgBuilder = modify
				.getCreator()
				.startMessage()
				.setRoom(room)
				.setSender(appUser)
				.setText(AdminChannelMessages.welcome());

			await modify.getCreator().finish(msgBuilder);
		}

		await RestrictionManager.dmUser(
			read,
			modify,
			installer,
			AdminChannelMessages.installDm(ADMIN_CHANNEL_NAME),
		);
	}

	public async onUninstall(
		context: IAppUninstallationContext,
		read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		try {
			const room = await read
				.getRoomReader()
				.getByName(ADMIN_CHANNEL_NAME);
			if (room) {
				try {
					await modify.getDeleter().deleteRoom(room.id);
				} catch (roomErr) {
					this.getLogger().warn(
						'[SpamMonitor] onUninstall: deleteRoom error:',
						roomErr,
					);
				}
			}

			try {
				await RestrictionManager.dmUser(
					read,
					modify,
					context.user,
					AdminChannelMessages.uninstallDm(ADMIN_CHANNEL_NAME),
				);
			} catch (dmErr) {
				this.getLogger().warn(
					'[SpamMonitor] onUninstall: DM error:',
					dmErr,
				);
			}
		} catch (err) {
			this.getLogger().error(
				'[SpamMonitor] onUninstall: unexpected error:',
				err,
			);
		}
	}

	public async onSettingUpdated(
		_setting: ISetting,
		_configurationModify: IConfigurationModify,
		read: IRead,
	): Promise<void> {
		await this.loadSettings(read.getEnvironmentReader());
	}

	private async loadSettings(env: IEnvironmentRead): Promise<void> {
		const settings = env.getSettings();
		const [
			monitoringWindowDays,
			slidingWindowSeconds,
			crossChannelThreshold,
			rateShortBurst,
			rateSustained,
		] = (await Promise.all([
			settings.getValueById(AppSetting.MonitoringWindowDays),
			settings.getValueById(AppSetting.SlidingWindowSeconds),
			settings.getValueById(AppSetting.CrossChannelThreshold),
			settings.getValueById(AppSetting.RateShortBurst),
			settings.getValueById(AppSetting.RateSustained),
		])) as number[];

		const config: SpamConfig = {
			monitoringWindowMs: monitoringWindowDays * MS_PER_DAY,
			slidingWindowMs: slidingWindowSeconds * MS_PER_SECOND,
			crossChannelThreshold,
			rateShortBurst,
			rateSustained,
		};

		if (this.processor) {
			this.processor.updateConfig(config);
		} else {
			this.processor = new SpamProcessor(this.cache, config);
		}
	}

	public async checkPreMessageSentPrevent(
		message: IMessage,
	): Promise<boolean> {
		if (!message.sender || !message.room || !message.text) return false;
		return message.room.type !== RoomType.DIRECT_MESSAGE;
	}

	public async executePreMessageSentPrevent(
		message: IMessage,
		read: IRead,
		_http: IHttp,
		persistence: IPersistence,
	): Promise<boolean> {
		if (!message.sender || !message.room) return false;
		if (await WhitelistStore.isRoomWhitelisted(read, message.room.id)) {
			return false;
		}
		if (
			await WhitelistStore.isUserWhitelistedByRole(read, message.sender)
		) {
			return false;
		}
		try {
			const { restricted } = await UserStatusStore.isRestricted(
				read,
				persistence,
				message.sender.id,
			);
			return restricted;
		} catch (err) {
			this.getLogger().error('[antispam] Error in isRestricted:', err);
			return false;
		}
	}

	public async checkPostMessageSent(message: IMessage): Promise<boolean> {
		if (!message.text || message.room.type === RoomType.DIRECT_MESSAGE)
			return false;
		return true;
	}

	public async executePostMessageSent(
		message: IMessage,
		read: IRead,
		_http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		if (!message.sender || !message.room) return;
		const sender = await read.getUserReader().getById(message.sender.id);
		const appUser = await read.getUserReader().getAppUser();
		if (
			!sender ||
			sender.id === appUser?.id ||
			!this.processor?.isNewUser(sender)
		)
			return;
		try {
			if (await WhitelistStore.isRoomWhitelisted(read, message.room.id)) {
				return;
			}
			if (await WhitelistStore.isUserWhitelistedByRole(read, sender)) {
				return;
			}
			const result = await this.processor.analyzeMessage(
				message,
				read,
				persistence,
			);
			if (result?.flagged && result.record && result.levelChanged) {
				const levelConfig = await LevelConfigStore.get(
					read,
					result.record.spammingLevel,
				);
				await RestrictionManager.applyAction(
					read,
					modify,
					persistence,
					sender,
					result.record,
					{
						levelChanged: result.levelChanged,
						trigger: result.trigger,
						roomName: message.room.slugifiedName ?? message.room.id,
					},
					levelConfig,
				);
			}
		} catch (err) {
			this.getLogger().error('[antispam] Error in analyzeMessage:', err);
		}
	}

	public async executeBlockActionHandler(
		context: UIKitBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse> {
		return new BlockActionHandler(
			read,
			http,
			persistence,
			modify,
			context,
			this.getID(),
		).handle();
	}
	public async executeViewSubmitHandler(
		context: UIKitViewSubmitInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse> {
		return new ViewSubmitHandler(
			read,
			http,
			persistence,
			modify,
			this.getID(),
			context,
		).handle();
	}
}
