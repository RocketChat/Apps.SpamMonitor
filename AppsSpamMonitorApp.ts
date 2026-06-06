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
import {
	AppMethod,
	IAppInfo,
} from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { SpamProcessor } from './src/core/spamProcessor';
import { MessageCache } from './src/core/cache/messageCache';
import { SpamMonitorCommand } from './src/commands/commandUtilities';
import { APP_SETTINGS } from './src/config/settings';
import { AppSetting } from './src/enums/settings';
import { SpamConfig } from './src/definition/spamProcessor';
import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { ActionId, DashboardActionId } from './src/enums/modals/dashboardModal';
import {
	IUIKitResponse,
	UIKitActionButtonInteractionContext,
	UIKitBlockInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { buildDashboardModal } from './src/modal/dashboardModal';

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

		configuration.ui.registerButton({
			actionId: ActionId.DASHBOARD_BUTTON,
			context: UIActionButtonContext.ROOM_ACTION,
			labelI18n: 'Spam Monitor Dashboard',
			when: {
				hasOneRole: ['admin'],
			},
		});

		await configuration.slashCommands.provideSlashCommand(
			new SpamMonitorCommand(this.getID()),
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
	public async executeActionButtonHandler(
		context: UIKitActionButtonInteractionContext,
		read: IRead,
		_http: IHttp,
		_persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse> {
		const { actionId, triggerId, user } = context.getInteractionData();

		if (actionId === ActionId.DASHBOARD_BUTTON) {
			const modal = await buildDashboardModal(read, this.getID());
			await modify
				.getUiController()
				.openSurfaceView(modal, { triggerId }, user);
		}

		return context.getInteractionResponder().successResponse();
	}

	public async executeBlockActionHandler(
		context: UIKitBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse> {
		const { actionId, value } = context.getInteractionData();

		if (actionId === DashboardActionId.SEARCH_ACTION_ID) {
			const updatedModal = await buildDashboardModal(
				read,
				this.getID(),
				value,
			);
			return context
				.getInteractionResponder()
				.updateModalViewResponse(updatedModal);
		}

		return context.getInteractionResponder().successResponse();
	}
}
