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
		`Привет, @${username}! Мы заметили необычную активность на твоём аккаунте.\n\nТвои сообщения сейчас отслеживаются. Пожалуйста, снизь темп и не отправляй повторяющиеся или одинаковые сообщения в разных каналах.\n\nЕсли это продолжится, могут быть применены дополнительные ограничения.`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}, твой аккаунт был помещён в режим ожидания на ${duration}.\n\nВ течение этого времени ты не сможешь отправлять сообщения. Причиной стало неоднократно зафиксированное подозрительное поведение.\n\nОграничение будет снято автоматически по истечении периода ожидания.`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}, твой аккаунт был лишён возможности отправлять сообщения на ${duration}.\n\nЭто связано с продолжающимся спам-подобным поведением после предыдущих предупреждений. Твои сообщения будут блокироваться до окончания периода блокировки.\n\nЕсли ты считаешь, что это ошибка, обратись к администратору.`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}, твой аккаунт был отмечен для проверки администратором.\n\nВ настоящее время ты не можешь отправлять сообщения, пока администратор не проверит твой аккаунт и не снимет ограничение.\n\nЕсли тебе нужна немедленная помощь, обратись напрямую к администратору.`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**Панель администратора SpamMonitor**\n\n` +
		`Это выделенный административный канал для приложения SpamMonitor. ` +
		`Все слэш-команды должны выполняться только из этого канала.\n\n` +
		`---\n\n` +
		`**Уровни спама и действия по умолчанию** \n` +
		`• \`Clean\` — Проблем не обнаружено\n` +
		`• \`Monitored\` — Зафиксирована необычная активность; за пользователем ведётся наблюдение\n` +
		`• \`Restricted\` — Пользователь помещён в режим ожидания на определённый срок\n` +
		`• \`Suspended\` — Пользователь заблокирован на более длительный срок\n` +
		`• \`AdminReview\` — Полностью заблокирован; ожидает ручного решения администратора\n\n` +
		`---\n\n` +
		`**Доступные команды** (\`/spammonitor <подкоманда>\`)\n` +
		`• \`list\` — Просмотреть всех пользователей, отмеченных в данный момент\n` +
		`• \`manage <username>\` — Открыть панель управления отмеченным пользователем\n` +
		`• \`level\` — Настроить действие и уведомление для каждого уровня спама\n\n` +
		`• \`schedule\` — Настроить расписание для запланированных отчётов о спаме\n\n` +
		`• \`config\` — Настроить параметры SpamMonitor, например список разрешённых каналов и ролей\n\n` +
		`• \`help\` — Показать это справочное сообщение\n\n` +
		`---\n\n` +
		`**Настройка параметров**\n` +
		`_Настрой пороговые значения и временные окна в Marketplace → Private Apps → Apps.SpamMonitor._`,

	installDm: (channelName: string) =>
		`**SpamMonitor установлен!**\n\n` +
		`Создан административный канал \`#${channelName}\`.\n` +
		`Все слэш-команды ограничены только этим каналом.\n` +
		`Настрой параметры в *Marketplace → Private Apps → Apps.SpamMonitor*.`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor удалён.**\n\n` + `Канал \`#${channelName}\` был удалён.`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} успешно поручился(лась) администратор @${adminUsername} — теперь пользователь полностью освобождён от мониторинга спама.`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`Период ожидания для @${targetUsername} успешно сброшен администратором @${adminUsername}.`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`Уровень спама для @${targetUsername} успешно снижен с *${beforeLabel}* → *${afterLabel}* администратором @${adminUsername}.`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} успешно сброшен(а) до уровня *Clean* администратором @${adminUsername}.`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: 'Поручиться за пользователя',
		description:
			'Это отметит пользователя как *доверенного* и полностью освободит его от мониторинга спама.',
		confirmLabel: 'Подтвердить поручительство',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: 'Сбросить период ожидания',
		description:
			'Это немедленно снимет активный период ожидания/тайм-аут для данного пользователя.',
		confirmLabel: 'Сбросить период ожидания',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: 'Понизить уровень',
		description: 'Это снизит уровень спама на одну ступень.',
		confirmLabel: 'Понизить уровень',
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: 'Сбросить до Clean',
		description:
			'Это немедленно сбросит уровень спама до *Clean*, сняв все ограничения.',
		confirmLabel: 'Сбросить до Clean',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*Настройка поведения уровня* — выбери уровень, укажи, ' +
		'что должен делать бот при достижении пользователем этого уровня, и при желании настрой ' +
		'сообщение, которое ему отправляется. Оставь сообщение пустым, чтобы использовать значение по умолчанию.',
	levelOverviewModalHeader:
		'*Настройка уровней спама*\n' +
		'Ознакомься с поведением каждого уровня ниже. ' +
		'Нажми *Изменить*, чтобы поменять действие, тайм-аут или сообщение уведомления для уровня.',
	timeoutLabel:
		'Длительность тайм-аута (в секундах) — используется только если действие — «Timeout»',
	customNotificationLabel:
		'Пользовательское сообщение уведомления, используй {user} и {duration} как переменные — (оставь пустым для сообщения по умолчанию)',
	customNotificationHint: `Оставь пустым, чтобы использовать сообщение по умолчанию, показанное в подсказке.`,
	defaultNotificationInputPlaceholder:
		'Сообщение, отправляемое пользователю при срабатывании этого уровня...',
};

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`Изменений для *${levelLabel(level)}* не обнаружено.`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`Конфигурация уровня обновлена* администратором @${adminUsername}*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`Конфигурация уровня успешно сохранена администратором @${adminUsername}`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}* сброшен(а) до настроек по умолчанию администратором @${adminUsername}.`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: 'Подтвердить действие',
		description: 'Вы уверены, что хотите выполнить это действие?',
		confirmLabel: 'Подтвердить',
	},
	LevelResetToDefault: {
		title: 'Сбросить до значений по умолчанию',
		description:
			'Вы уверены, что хотите сбросить действие, тайм-аут и сообщение этого уровня до значений по умолчанию? Это действие нельзя отменить.',
		confirmLabel: 'Сбросить',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} настроил(а) расписание отчётов об отмеченных пользователях для этого канала.`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} удалил(а) расписание отчётов об отмеченных пользователях для этого канала. Автоматические отчёты больше отправляться не будут.`,
};

export const dailyReportNotification = {
	title: (dateStr: string) =>
		`**Ежедневный отчёт по борьбе со спамом** — ${dateStr}`,

	allClear: {
		heading:
			'**Всё чисто** — спам-активности за этот период не обнаружено.',
		flagsLine: '• Отметок: 0',
		flaggedUsersLine: '• Отмеченных пользователей: 0',
		trackedUsersLine: (count: number) =>
			`• Отслеживаемых пользователей: ${count}`,
	},

	summary: {
		heading: '**Сводка:**',
		flagsLine: (count: number) => `• Отметок за этот период: ${count}`,
		flaggedUsersLine: (count: number) =>
			`• Пользователей, отмеченных в данный момент: ${count}`,
		adminActionsLine: (count: number) =>
			`• Административных действий за этот период: ${count}`,
		trackedUsersLine: (count: number) =>
			`• Всего отслеживаемых пользователей: ${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}** (${count}):`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — всего отметок: ${totalFlags}`,
	},

	flaggedUsers: {
		heading: '**Отмеченные пользователи (за этот период):**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} отметок (${triggerList}) — текущий статус: ${currentLabel}`,
		rooms: (roomsList: string) => `      _Комнаты: ${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _Комнаты: ${roomsList} (+ ещё, показаны первые ${MAX_ROOMS_PER_SUMMARY})_`,
	},

	adminActions: {
		heading: '**Административные действия (за этот период):**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label}, выполнено @${adminUsername}`,
	},

	moreCount: (n: number) => `  _...и ещё ${n}_`,
};

export const scheduleSetupModalText = {
	everyDay: 'Каждый день',
	days: {
		sun: 'Вс',
		mon: 'Пн',
		tue: 'Вт',
		wed: 'Ср',
		thu: 'Чт',
		fri: 'Пт',
		sat: 'Сб',
	},
	cadenceLabels: {
		daily: 'Ежедневно',
		weekdays: 'По будням',
		weekly: 'Еженедельно',
		custom: 'Пользовательский',
	},
	setup: {
		headerDefault:
			'Настрой, когда отчёт об отмеченных пользователях будет отправляться в этот канал.',
		headerExisting: (desc: string) =>
			`*Текущее расписание:* ${desc}\n\nНастрой замену ниже — после подтверждения это перезапишет существующее расписание.`,
		deleteButton: 'Удалить текущее расписание',
		cadenceLabel: 'Периодичность',
		cadencePlaceholder: 'Выбери периодичность',
		cadenceHint:
			'*Ежедневно:* каждый день  ·  *По будням:* пн–пт  ·  *Еженедельно:* каждый понедельник\n*Пользовательский:* выбери конкретные дни ниже (используется только при периодичности «Пользовательский»).',
		daysLabel: 'Дни (только для периодичности «Пользовательский»)',
		daysPlaceholder: 'Выбери дни',
		timeLabel: 'Время',
		title: 'Запланировать отчёт',
		previewButton: 'Предпросмотр',
	},
	confirm: {
		title: 'Подтвердить расписание',
		backButton: '← Назад',
		confirmButton: 'Подтвердить и запланировать',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*Периодичность:* ${cadence}\n` +
			`*Дни:* ${days}\n` +
			`*Время:* ${time} (${offset})\n\n` +
			`*Следующий запуск:* ${nextRun}` +
			(hadExisting ? `\n\n_Это заменит существующее расписание._` : ''),
	},
	delete: {
		title: 'Удалить расписание',
		confirmButton: 'Удалить расписание',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*Существующее расписание:*\n` +
			`*Периодичность:* ${cadence}\n` +
			`*Дни:* ${days}\n` +
			`*Время:* ${time} (${offset})\n\n` +
			`*Это остановит и удалит выполняющееся задание по расписанию. Автоматические отчёты больше не будут отправляться, пока не будет настроено новое расписание.*`,
	},
};

export const scheduleValidationText = {
	invalidTime: 'Введи корректное время в формате ЧЧ:ММ, например 09:00',
	missingCustomDays:
		'Выбери хотя бы один день для периодичности «Пользовательский».',
};
export const whitelistModalText = {
	whitelistModalTitle: 'Список разрешений SpamMonitor',
	whitelistModalSubTitle:
		'Каналы и роли, перечисленные здесь, полностью исключены из мониторинга спама — без обнаружения, без ограничений. Отредактируй любой из списков и нажми «Сохранить»; всё, что будет удалено из списка, потеряет статус разрешённого.',
	channelListLabel: 'Разрешённые каналы (через запятую)',
	roleListLabel: 'Разрешённые роли (через запятую)',
	channelListInputPlaceholder: 'general, random, support',
	roleListInputPlaceholder: 'moderator, admin, support-team',
	channelListInputHint:
		'*Названия каналов чувствительны к регистру — вводи их точно так, как они указаны в Rocket.Chat (например, "general", а не "General").' +
		'\n' +
		'Если ты не уверен(а) в регистре названия канала, проверь список каналов в Rocket.Chat.',
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
				`Добавлено в список разрешений: ${addedChannels.map((c) => `#${c}`).join(', ')}.`,
			);
		}
		if (removedChannels.length > 0) {
			parts.push(
				`Удалено из списка разрешений: ${removedChannels.map((c) => `#${c}`).join(', ')}.`,
			);
		}
		if (addedRoles.length > 0) {
			parts.push(
				`Добавлена(ы) роль(и) в список разрешений: ${addedRoles.map((r) => `\`${r}\``).join(', ')}.`,
			);
		}
		if (removedRoles.length > 0) {
			parts.push(
				`Удалена(ы) роль(и) из списка разрешений: ${removedRoles.map((r) => `\`${r}\``).join(', ')}.`,
			);
		}
		if (notFoundChannels.length > 0) {
			parts.push(
				`Не удалось найти: ${notFoundChannels.map((c) => `#${c}`).join(', ')}. Проверь названия каналов на наличие заглавных букв.`,
			);
		}
		if (parts.length === 0) {
			return 'Список разрешений SpamMonitor сохранён — без изменений.';
		}
		return `Список разрешений SpamMonitor обновлён. ${parts.join(' ')}`;
	},
};
export const configModalText = {
	title: 'Настройки SpamMonitor',
	header: 'Выбери раздел ниже для настройки.',
	configureButton: 'Настроить',
};
export const slashNotifications = {
	NO_FLAGGED_USERS: 'На данный момент нет отмеченных пользователей.',
	NO_PERMISSION: 'У тебя нет прав для использования этой команды.',
	ADMIN_CHANNEL_ONLY:
		'Эту команду можно использовать только в административном канале.',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`Отмеченные пользователи по фильтру *${filter}* не найдены.`,
	USER_NOT_FOUND: (username: string) =>
		`Пользователь *@${username}* не найден или не имеет истории спама.`,
	MANAGE_MISSING_USERNAME: 'Использование: `/spammonitor manage <username>`',
	LEVEL_MISSING_LEVEL: 'Использование: `/spammonitor level`',
	SCHEDULE_MISSING_TRIGGER: 'Использование: `/spammonitor schedule`',
	CONFIG_MISSING_TRIGGER: 'Использование: `/spammonitor config`',
};

export const slashCommandHelp = {
	HELP:
		'*Команды SpamMonitor*\n' +
		'`/spammonitor list all` — все отмеченные пользователи, сначала с наивысшим уровнем\n' +
		'`/spammonitor list timeout` — пользователи, находящиеся сейчас в активном режиме ожидания\n' +
		'`/spammonitor list <Level>` — пользователи на определённом уровне, например `list review` для пользователей на административной проверке\n' +
		'`/spammonitor manage <username>` — открыть панель управления отмеченным пользователем\n' +
		'`/spammonitor level` — настроить действие и уведомление для каждого уровня спама\n' +
		'`/spammonitor schedule` — настроить ежедневный отчёт по борьбе со спамом\n' +
		'`/spammonitor config` — настроить список разрешённых каналов и ролей, освобождённых от мониторинга спама',
};

export const languageModalText = {
	title: 'Языковые настройки',
	header: 'Выбери предпочитаемый язык для сообщений бота, модальных окон и уведомлений.',
	selectLabel: 'Язык',
	selectPlaceholder: 'Выбери язык',
};

export const commonModalText = {
	cancel: 'Отмена',
	submit: 'Отправить',
	edit: 'Изменить',
	close: 'Закрыть',
	save: 'Сохранить',
};
export const languageNotification = {
	LanguageChanged: (languageLabel: string) =>
		`Твой язык интерфейса изменён на *${languageLabel}*.`,
};

export const EditLevelModalStrings = {
	modalTitle: (levelLabelText: string) => `Изменить — ${levelLabelText}`,
	headerTitle: (levelLabelText: string) =>
		`*Редактирование: ${levelLabelText}*`,
	backToOverviewButton: '← Назад к обзору',
	resetToDefaultButton: 'Сбросить до значений по умолчанию',
	actionSelectLabel: 'Действие',
	actionSelectPlaceholder: 'Выбери действие',
	timeoutPlaceholder: (defaultTimeout: number) =>
		`например, ${defaultTimeout}`,
};
export const LevelOverviewModalStrings = {
	modalTitle: 'Настройка уровня',
	actionSummaryPrefix: (levelLabelText: string, actionSummary: string) =>
		`*${levelLabelText}*\nДействие: ${actionSummary}`,
	messagePreviewPrefix: (messagePreview: string) =>
		`Сообщение: ${messagePreview}`,
	noCustomMessage:
		'_Пользовательское сообщение не задано (используется значение по умолчанию)_',
	messagePreviewTruncated: (preview: string) => `_«${preview}…»_`,
	messagePreviewFull: (preview: string) => `_«${preview}»_`,
};
export const ManageUserModalStrings = {
	modalTitle: (username: string) => `Управление @${username}`,
	userLabel: (username: string) => `*Пользователь:* @${username}`,
	spamLevelFieldLabel: (levelLabelText: string) =>
		`*Уровень спама:*\n${levelLabelText}`,
	cooldownFieldLabel: (cooldownText: string) =>
		`*Период ожидания:*\n${cooldownText}`,
	lastEscalationFieldLabel: (dateText: string) =>
		`*Последняя эскалация:*\n${dateText}`,
	actionsHeader: '*Административные действия*',
	vouchButtonFallback: 'Поручиться',
	resetCooldownButtonFallback: 'Сбросить период ожидания',
	levelDownButtonFallback: 'Понизить уровень',
	resetToCleanButtonFallback: 'Сбросить до Clean',
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
		`Всегo отмечено: *${total}* | ` +
		`Под наблюдением: *${monitored}* | ` +
		`Ограничены: *${restricted}* | ` +
		`Заблокированы: *${suspended}* | ` +
		`Ожидают проверки: *${adminReview}* | ` +
		`В режиме ожидания: *${timedOut}*`,
	userRowLine: (username: string, label: string, cooldownStr: string) =>
		`@${username} — *${label}*${cooldownStr}`,
	cooldownSuffix: (formattedDate: string) =>
		` | режим ожидания до ${formattedDate} UTC`,
	manageUserOverflowOption: 'Управление пользователем',
	listHeader: (summary: string, title: string) => `${summary}\n\n*${title}*`,
	listTitleSuffix: (title: string) => `Пользователи: ${title}`,
	allFlaggedUsersTitle: 'Все отмеченные пользователи',
	pendingAdminReviewTitle: 'Ожидают административной проверки',
	unknownLevelError: (levelName: string, validLevels: string) =>
		`Неизвестный уровень *${levelName}*. Допустимые уровни: ${validLevels}.\n` +
		`Для пользователей на административной проверке используй \`list review\`.`,
	activeTimeoutTitle: 'Пользователи в активном режиме ожидания',
	activeTimeoutFilterKey: 'активный режим ожидания',
};
export const configEntriesText = {
	whitelist: {
		label: 'Белый список',
		description:
			'Каналы и роли, полностью исключённые из мониторинга спама.',
	},
	language: {
		label: 'Язык',
		description: 'Выберите язык для сообщений и модальных окон бота.',
	},
};
