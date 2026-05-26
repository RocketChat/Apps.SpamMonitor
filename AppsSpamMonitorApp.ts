import {
	IAppAccessors,
	IConfigurationExtend,
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
import { SpamProcessor } from './src/core/spamProcessor';
import { MessageCache } from './src/core/cache/messageCache';
import { SpamMonitorCommand } from './src/commands/commandUtilities';
import { SpamConfig } from './src/definition/spamProcessor';

// Hardcoded defaults — settings will be introduced in a follow-up PR
const DEFAULT_CONFIG: SpamConfig = {
	monitoringWindowMs: 42 * 24 * 60 * 60 * 1000, // 42 days
	slidingWindowMs: 5 * 60 * 1000, // 5 min
	crossChannelThreshold: 3,
	rateShortBurst: 5,
	rateSustained: 12,
};

export class AppsSpamMonitorApp extends App implements IPostMessageSent {
	private processor: SpamProcessor;
	private cache: MessageCache;

	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	public async initialize(
		configurationExtend: IConfigurationExtend,
		environmentRead: IEnvironmentRead,
	): Promise<void> {
		this.cache = new MessageCache();
		this.processor = new SpamProcessor(this.cache, DEFAULT_CONFIG);
		await super.initialize(configurationExtend, environmentRead);
	}

	protected async extendConfiguration(
		configuration: IConfigurationExtend,
	): Promise<void> {
		await configuration.slashCommands.provideSlashCommand(
			new SpamMonitorCommand(),
		);
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
		if (!sender || !this.processor.isNewUser(sender)) {
			return;
		}

		try {
			await this.processor.analyzeMessage(message, read, persistence);
		} catch (err) {
			this.getLogger().error('[antispam] Error in analyzeMessage:', err);
		}
	}
}
