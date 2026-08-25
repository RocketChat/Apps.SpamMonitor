import { MAX_ROOMS_PER_SUMMARY } from '../../../constants/scheduleLogStore';
import { ConfirmMeta } from '../../../definition/confirmationModal';
import { levelLabel } from '../../../definition/levelConfig';
import {
	SPAMMING_LEVEL_LABELS,
	SpammingLevel,
} from '../../../definition/spamlevel';
import { ManageUserActionId } from '../../../enums/modals/manageUsers';

export type NotifyFn = (username: string, duration: string) => string;

export const Messages: Record<SpammingLevel, NotifyFn | null> = {
	[SpammingLevel.Clean]: null,
	[SpammingLevel.Monitored]: (username) =>
		`@${username}，我们注意到你的账户存在异常活动。\n\n你的消息目前正在被监控。请放慢发送速度，避免在多个频道发送重复或相同的消息。\n\n如果这种情况持续，可能会施加进一步的限制。`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}，你的账户已被设置为 ${duration} 的冷却期。\n\n在此期间你将无法发送消息。此操作是由反复被标记的行为触发的。\n\n冷却期结束后，限制将自动解除。`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}，你的账户已被暂停发送消息 ${duration}。\n\n这是由于在多次警告后仍持续出现类似垃圾信息的行为所致。在暂停期结束前，你的消息将被拦截。\n\n如果你认为这是误判，请联系管理员。`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}，你的账户已被标记为需要管理员审核。\n\n在管理员审核你的账户并解除限制之前，你将无法发送消息。\n\n如需立即协助，请直接联系管理员。`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**SpamMonitor 管理面板**\n\n` +
		`这是 SpamMonitor 应用的专属管理频道。 ` +
		`所有斜杠命令都必须在此频道中执行。\n\n` +
		`---\n\n` +
		`**垃圾信息等级与默认操作** \n` +
		`• \`Clean\` — 未检测到问题\n` +
		`• \`Monitored\` — 检测到异常活动；用户正在被观察\n` +
		`• \`Restricted\` — 用户已被设置为限时冷却\n` +
		`• \`Suspended\` — 用户已被较长时间暂停\n` +
		`• \`AdminReview\` — 已完全封锁；等待管理员手动处理\n\n` +
		`---\n\n` +
		`**可用命令** (\`/spammonitor <子命令>\`)\n` +
		`• \`list\` — 查看所有当前被标记的用户\n` +
		`• \`manage <username>\` — 打开某个被标记用户的管理控制项\n` +
		`• \`level\` — 配置各垃圾信息等级的操作和通知\n\n` +
		`• \`schedule\` — 配置定期垃圾信息报告的时间安排\n\n` +
		`• \`config\` — 配置反垃圾监控设置，例如频道和角色白名单\n\n` +
		`• \`help\` — 显示此帮助信息\n\n` +
		`---\n\n` +
		`**配置设置**\n` +
		`_请在 Marketplace → Private Apps → Apps.SpamMonitor 中配置阈值和时间窗口。_`,

	installDm: (channelName: string) =>
		`**SpamMonitor 已安装！**\n\n` +
		`已创建管理面板频道 \`#${channelName}\`。\n` +
		`所有斜杠命令仅限于该频道使用。\n` +
		`请在 *Marketplace → Private Apps → Apps.SpamMonitor* 中配置设置。`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor 已卸载。**\n\n` + `频道 \`#${channelName}\` 已被移除。`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} 已由 @${adminUsername} 成功担保 — 现已完全免除垃圾信息监控。`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} 的冷却期已由 @${adminUsername} 成功重置。`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`@${targetUsername} 的垃圾信息等级已由 @${adminUsername} 成功从 *${beforeLabel}* → *${afterLabel}* 降级。`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} 已由 @${adminUsername} 成功重置为 *Clean*。`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: '为用户担保',
		description:
			'此操作会将该用户标记为*可信任*，并使其完全免除垃圾信息监控。',
		confirmLabel: '确认担保',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: '重置冷却期',
		description: '此操作会立即解除该用户当前生效的冷却期/超时限制。',
		confirmLabel: '重置冷却期',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: '降低等级',
		description: '此操作会将垃圾信息等级降低一级。',
		confirmLabel: '降低等级',
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: '重置为 Clean',
		description:
			'此操作会立即将垃圾信息等级重置为 *Clean*，并移除所有限制。',
		confirmLabel: '重置为 Clean',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*配置等级行为* — 选择一个等级，设置' +
		'当用户达到该等级时机器人应执行的操作，并可选择自定义' +
		'发送给该用户的消息。留空则使用默认消息。',
	levelOverviewModalHeader:
		'*垃圾信息等级配置*\n' +
		'请在下方查看每个等级的行为。' +
		'点击*编辑*可修改某个等级的操作、超时时长或通知消息。',
	timeoutLabel: '超时时长（秒）— 仅在操作为“Timeout”时使用',
	customNotificationLabel:
		'自定义通知消息，使用 {user} 和 {duration} 作为占位符 -（留空则使用默认消息）',
	customNotificationHint: `留空将使用占位符中显示的默认消息。`,
	defaultNotificationInputPlaceholder: '当此等级触发时发送给用户的消息……',
};

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`未检测到 *${levelLabel(level)}* 有任何更改。`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`等级配置已由 @${adminUsername}* 更新*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`等级配置已由 @${adminUsername} 成功保存`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}* 已由 @${adminUsername} 重置为默认设置。`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: '确认操作',
		description: '确定要执行此操作吗？',
		confirmLabel: '确认',
	},
	LevelResetToDefault: {
		title: '重置为默认值',
		description:
			'确定要将此等级的操作、超时时长和消息重置为默认值吗？此操作无法撤销。',
		confirmLabel: '重置',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} 已为此频道设置了被标记用户报告的时间安排。`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} 已移除此频道的被标记用户报告时间安排。将不再发送自动报告。`,
};

export const dailyReportNotification = {
	title: (dateStr: string) => `**每日反垃圾信息报告** — ${dateStr}`,

	allClear: {
		heading: '**一切正常** — 此期间未发现垃圾信息活动。',
		flagsLine: '• 标记次数：0',
		flaggedUsersLine: '• 被标记用户：0',
		trackedUsersLine: (count: number) => `• 已跟踪用户：${count}`,
	},

	summary: {
		heading: '**摘要：**',
		flagsLine: (count: number) => `• 本期间标记次数：${count}`,
		flaggedUsersLine: (count: number) => `• 当前被标记用户：${count}`,
		adminActionsLine: (count: number) => `• 本期间管理员操作次数：${count}`,
		trackedUsersLine: (count: number) => `• 已跟踪用户总数：${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}**（${count}）：`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — 共 ${totalFlags} 次标记`,
	},

	flaggedUsers: {
		heading: '**被标记用户（本期间）：**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} 次标记（${triggerList}）— 当前状态：${currentLabel}`,
		rooms: (roomsList: string) => `      _房间：${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _房间：${roomsList}（+更多，仅显示前 ${MAX_ROOMS_PER_SUMMARY} 个）_`,
	},

	adminActions: {
		heading: '**管理员操作（本期间）：**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label}，由 @${adminUsername} 执行`,
	},

	moreCount: (n: number) => `  _……还有 ${n} 个_`,
};

export const scheduleSetupModalText = {
	everyDay: '每天',
	days: {
		sun: '周日',
		mon: '周一',
		tue: '周二',
		wed: '周三',
		thu: '周四',
		fri: '周五',
		sat: '周六',
	},
	cadenceLabels: {
		daily: '每天',
		weekdays: '工作日',
		weekly: '每周',
		custom: '自定义',
	},
	setup: {
		headerDefault: '设置何时向此频道发送被标记用户报告。',
		headerExisting: (desc: string) =>
			`*当前时间安排：* ${desc}\n\n请在下方设置替代方案 — 确认后将覆盖现有的时间安排。`,
		deleteButton: '删除当前时间安排',
		cadenceLabel: '频率',
		cadencePlaceholder: '选择频率',
		cadenceHint:
			'*每天：* 每天一次  ·  *工作日：* 周一至周五  ·  *每周：* 每周一\n*自定义：* 在下方选择具体的日期（仅在频率为“自定义”时使用）。',
		daysLabel: '日期（仅限“自定义”频率）',
		daysPlaceholder: '选择日期',
		timeLabel: '时间',
		title: '安排报告',
		previewButton: '预览',
	},
	confirm: {
		title: '确认时间安排',
		backButton: '← 返回',
		confirmButton: '确认并安排',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*频率：* ${cadence}\n` +
			`*日期：* ${days}\n` +
			`*时间：* ${time}（${offset}）\n\n` +
			`*下次执行：* ${nextRun}` +
			(hadExisting ? `\n\n_这将替换现有的时间安排。_` : ''),
	},
	delete: {
		title: '删除时间安排',
		confirmButton: '删除时间安排',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*现有时间安排：*\n` +
			`*频率：* ${cadence}\n` +
			`*日期：* ${days}\n` +
			`*时间：* ${time}（${offset}）\n\n` +
			`*此操作将停止并移除正在运行的定时任务。在设置新的时间安排之前，将不再发送自动报告。*`,
	},
};

export const scheduleValidationText = {
	invalidTime: '请输入有效的时间，格式为 HH:MM，例如 09:00',
	missingCustomDays: '请至少为“自定义”频率选择一天。',
};
export const whitelistModalText = {
	whitelistModalTitle: '反垃圾监控白名单',
	whitelistModalSubTitle:
		'此处列出的频道和角色将完全排除在垃圾信息监控之外 — 不进行检测，不施加限制。编辑任意一个列表后点击保存；从列表中移除的项目将不再属于白名单。',
	channelListLabel: '白名单频道（以逗号分隔）',
	roleListLabel: '白名单角色（以逗号分隔）',
	channelListInputPlaceholder: 'general, random, support',
	roleListInputPlaceholder: 'moderator, admin, support-team',
	channelListInputHint:
		'*频道名称区分大小写 — 请按照 Rocket.Chat 中显示的确切名称输入（例如 "general"，而不是 "General"）。' +
		'\n' +
		'如果不确定频道名称的大小写，请在 Rocket.Chat 的频道列表中查看。',
};
export const whitelistNotification = {
	WhitelistUpdated: (
		addedChannels: string[],
		removedChannels: string[],
		addedRoles: string[],
		removedRoles: string[],
		notFoundChannels: string[],
	): string => {
		const parts: string[] = [];

		if (addedChannels.length > 0) {
			parts.push(
				`已将 ${addedChannels.map((c) => `#${c}`).join('、')} 添加到白名单。`,
			);
		}
		if (removedChannels.length > 0) {
			parts.push(
				`已将 ${removedChannels.map((c) => `#${c}`).join('、')} 从白名单中移除。`,
			);
		}
		if (addedRoles.length > 0) {
			parts.push(
				`已将角色 ${addedRoles.map((r) => `\`${r}\``).join('、')} 添加到白名单。`,
			);
		}
		if (removedRoles.length > 0) {
			parts.push(
				`已将角色 ${removedRoles.map((r) => `\`${r}\``).join('、')} 从白名单中移除。`,
			);
		}
		if (notFoundChannels.length > 0) {
			parts.push(
				`未找到：${notFoundChannels.map((c) => `#${c}`).join('、')}。请检查频道名称中是否有大写字母。`,
			);
		}
		if (parts.length === 0) {
			return '反垃圾监控白名单已保存 — 没有更改。';
		}
		return `反垃圾监控白名单已更新。${parts.join(' ')}`;
	},
};
export const configModalText = {
	title: 'SpamMonitor 配置',
	header: '请选择下方的某个部分进行配置。',
	configureButton: '配置',
};
export const slashNotifications = {
	NO_FLAGGED_USERS: '目前没有被标记的用户。',
	NO_PERMISSION: '你没有权限使用此命令。',
	ADMIN_CHANNEL_ONLY: '此命令只能在管理频道中使用。',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`未找到符合筛选条件 *${filter}* 的被标记用户。`,
	USER_NOT_FOUND: (username: string) =>
		`未找到用户 *@${username}*，或该用户没有垃圾信息记录。`,
	MANAGE_MISSING_USERNAME: '用法：`/spammonitor manage <username>`',
	LEVEL_MISSING_LEVEL: '用法：`/spammonitor level`',
	SCHEDULE_MISSING_TRIGGER: '用法：`/spammonitor schedule`',
	CONFIG_MISSING_TRIGGER: '用法：`/spammonitor config`',
};

export const slashCommandHelp = {
	HELP:
		'*SpamMonitor 命令*\n' +
		'`/spammonitor list all` — 显示所有被标记的用户，按等级从高到低排列\n' +
		'`/spammonitor list timeout` — 显示当前处于活跃冷却期的用户\n' +
		'`/spammonitor list <Level>` — 显示某个特定等级的用户，例如使用 `list review` 查看待管理员审核的用户\n' +
		'`/spammonitor manage <username>` — 打开某个被标记用户的管理控制项\n' +
		'`/spammonitor level` — 配置各垃圾信息等级的操作和通知\n' +
		'`/spammonitor schedule` — 配置每日反垃圾信息报告\n' +
		'`/spammonitor config` — 配置免于垃圾信息监控的频道和角色白名单',
};

export const languageModalText = {
	title: '语言设置',
	header: '选择你偏好的语言，用于机器人消息、弹窗和通知。',
	selectLabel: '语言',
	selectPlaceholder: '选择语言',
};

export const commonModalText = {
	cancel: '取消',
	submit: '提交',
	edit: '编辑',
	close: '关闭',
	save: '保存',
};
export const languageNotification = {
	LanguageChanged: (languageLabel: string) =>
		`你的语言偏好已更改为 *${languageLabel}*。`,
};

export const EditLevelModalStrings = {
	modalTitle: (levelLabelText: string) => `编辑 — ${levelLabelText}`,
	headerTitle: (levelLabelText: string) => `*正在编辑：${levelLabelText}*`,
	backToOverviewButton: '← 返回概览',
	resetToDefaultButton: '重置为默认值',
	actionSelectLabel: '操作',
	actionSelectPlaceholder: '选择一个操作',
	timeoutPlaceholder: (defaultTimeout: number) => `例如 ${defaultTimeout}`,
};
export const LevelOverviewModalStrings = {
	modalTitle: '等级配置',
	actionSummaryPrefix: (levelLabelText: string, actionSummary: string) =>
		`*${levelLabelText}*\n操作：${actionSummary}`,
	messagePreviewPrefix: (messagePreview: string) => `消息：${messagePreview}`,
	noCustomMessage: '_无自定义消息（使用默认消息）_',
	messagePreviewTruncated: (preview: string) => `_"${preview}…"_`,
	messagePreviewFull: (preview: string) => `_"${preview}"_`,
};
export const ManageUserModalStrings = {
	modalTitle: (username: string) => `管理 @${username}`,
	userLabel: (username: string) => `*用户：* @${username}`,
	spamLevelFieldLabel: (levelLabelText: string) =>
		`*垃圾信息等级：*\n${levelLabelText}`,
	cooldownFieldLabel: (cooldownText: string) => `*冷却期：*\n${cooldownText}`,
	lastEscalationFieldLabel: (dateText: string) =>
		`*上次升级时间：*\n${dateText}`,
	actionsHeader: '*管理员操作*',
	vouchButtonFallback: '担保',
	resetCooldownButtonFallback: '重置冷却期',
	levelDownButtonFallback: '降低等级',
	resetToCleanButtonFallback: '重置为 Clean',
};

export const SpamMonitorHandlerStrings = {
	summaryLine: (
		total: number,
		monitored: number,
		restricted: number,
		suspended: number,
		adminReview: number,
		timedOut: number,
	) =>
		`标记总数：*${total}* | ` +
		`已监控：*${monitored}* | ` +
		`已限制：*${restricted}* | ` +
		`已暂停：*${suspended}* | ` +
		`待审核：*${adminReview}* | ` +
		`冷却中：*${timedOut}*`,
	userRowLine: (username: string, label: string, cooldownStr: string) =>
		`@${username} — *${label}*${cooldownStr}`,
	cooldownSuffix: (formattedDate: string) =>
		` | 冷却期至 ${formattedDate} UTC`,
	manageUserOverflowOption: '管理用户',
	listHeader: (summary: string, title: string) => `${summary}\n\n*${title}*`,
	listTitleSuffix: (title: string) => `${title}用户`,
	allFlaggedUsersTitle: '所有被标记的用户',
	pendingAdminReviewTitle: '待管理员审核',
	unknownLevelError: (levelName: string, validLevels: string) =>
		`未知等级 *${levelName}*。有效等级：${validLevels}。\n` +
		`如需查看待管理员审核的用户，请使用 \`list review\`。`,
	activeTimeoutTitle: '处于活跃冷却期的用户',
	activeTimeoutFilterKey: '活跃冷却期',
};
export const configEntriesText = {
	whitelist: {
		label: '白名单',
		description: '完全排除在垃圾信息监控之外的频道和角色。',
	},
	language: {
		label: '语言',
		description: '选择用于机器人消息和模态框的语言。',
	},
};
