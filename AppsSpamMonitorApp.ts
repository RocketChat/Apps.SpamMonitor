import {
	IAppAccessors,
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
} from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { SpamProcessor } from './src/core/spamProcessor';
import { MessageCache } from './src/core/cache/messageCache';
import { SpamMonitorCommand } from './src/commands/commandUtilities';
import { APP_SETTINGS } from './src/config/settings';
import { AppSetting } from './src/enums/settings';
import { SpamConfig } from './src/definition/spamProcessor';

const MS_PER_DAY = 86_400_000;
const MS_PER_SECOND = 1000;
export class AppsSpamMonitorApp extends App implements IPostMessageSent {
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
			new SpamMonitorCommand(),
		);
	}

	public async onEnable(
		environment: IEnvironmentRead,
		_configurationModify: IConfigurationModify,
	): Promise<boolean> {
		await this.loadSettings(environment);
		return true;
	}

	public async onSettingUpdated(
		_setting: ISetting,
		_configurationModify: IConfigurationModify,
		read: IRead,
		_http: IHttp,
	): Promise<void> {
		await this.loadSettings(read.getEnvironmentReader());
	}

	private async loadSettings(env: IEnvironmentRead): Promise<void> {
		const settings = env.getSettings();

		const monitoringWindowDays = (await settings.getValueById(
			AppSetting.MonitoringWindowDays,
		)) as number;
		const slidingWindowSeconds = (await settings.getValueById(
			AppSetting.SlidingWindowSeconds,
		)) as number;
		const crossChannelThreshold = (await settings.getValueById(
			AppSetting.CrossChannelThreshold,
		)) as number;
		const rateShortBurst = (await settings.getValueById(
			AppSetting.RateShortBurst,
		)) as number;
		const rateSustained = (await settings.getValueById(
			AppSetting.RateSustained,
		)) as number;

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

	public async executePostMessageSent(
		message: IMessage,
		read: IRead,
		_http: IHttp,
		persistence: IPersistence,
		_modify: IModify,
	): Promise<void> {
		if (!message.sender || !message.room) {
			return;
		}

		const sender = await read.getUserReader().getById(message.sender.id);
		if (!sender || !this.processor?.isNewUser(sender)) {
			return;
		}

		try {
			await this.processor.analyzeMessage(message, read, persistence);
		} catch (err) {
			this.getLogger().error('[antispam] Error in analyzeMessage:', err);
		}
	}
}
