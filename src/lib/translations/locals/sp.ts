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
		`Hola @${username}, hemos detectado actividad inusual en tu cuenta.\n\nTus mensajes están siendo monitoreados. Por favor, reduce el ritmo y evita enviar mensajes repetidos o idénticos en varios canales.\n\nSi esto continúa, se podrán aplicar restricciones adicionales.`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}, tu cuenta ha sido puesta en un período de espera de ${duration}.\n\nNo podrás enviar mensajes durante este período. Esto fue provocado por comportamiento marcado de forma repetida.\n\nLa restricción se levantará automáticamente cuando expire el período de espera.`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}, tu cuenta ha sido suspendida para enviar mensajes durante ${duration}.\n\nEsto se debe a un comportamiento continuo similar al spam después de advertencias previas. Tus mensajes serán bloqueados hasta que termine el período de suspensión.\n\nSi crees que esto es un error, ponte en contacto con un administrador.`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}, tu cuenta ha sido marcada para revisión administrativa.\n\nActualmente tienes restringido el envío de mensajes hasta que un administrador revise tu cuenta y levante la restricción.\n\nSi necesitas asistencia inmediata, contacta directamente a un administrador.`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**Panel de Administración de SpamMonitor**\n\n` +
		`Este es el canal de administración dedicado a la aplicación SpamMonitor. ` +
		`Todos los comandos de barra deben ejecutarse desde este canal.\n\n` +
		`---\n\n` +
		`**Niveles de Spam y Acciones Predeterminadas** \n` +
		`• \`Clean\` — No se detectaron problemas\n` +
		`• \`Monitored\` — Actividad inusual marcada; se está vigilando al usuario\n` +
		`• \`Restricted\` — Usuario puesto en un período de espera cronometrado\n` +
		`• \`Suspended\` — Usuario suspendido por un período más largo\n` +
		`• \`AdminReview\` — Totalmente bloqueado; a la espera de una acción manual del administrador\n\n` +
		`---\n\n` +
		`**Comandos Disponibles** (\`/spammonitor <subcomando>\`)\n` +
		`• \`list\` — Ver todos los usuarios actualmente marcados\n` +
		`• \`manage <username>\` — Abrir los controles administrativos de un usuario marcado\n` +
		`• \`level\` — Configurar la acción y la notificación por nivel de spam\n\n` +
		`• \`schedule\` — Configurar el horario de los informes programados de spam\n\n` +
		`• \`config\` — Configurar los ajustes de SpamMonitor, como la lista blanca de canales y roles\n\n` +
		`• \`help\` — Mostrar este mensaje de ayuda\n\n` +
		`---\n\n` +
		`**Configurar Ajustes**\n` +
		`_Configura los umbrales y las ventanas de tiempo en Marketplace → Aplicaciones Privadas → Apps.SpamMonitor._`,

	installDm: (channelName: string) =>
		`**¡SpamMonitor instalado!**\n\n` +
		`Se ha creado un canal de panel de administración \`#${channelName}\`.\n` +
		`Todos los comandos de barra están restringidos únicamente a ese canal.\n` +
		`Configura los ajustes en *Marketplace → Aplicaciones Privadas → Apps.SpamMonitor*.`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor desinstalado.**\n\n` +
		`El canal \`#${channelName}\` ha sido eliminado.`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} fue avalado con éxito por @${adminUsername} — ahora está totalmente exento del monitoreo de spam.`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`Período de espera de @${targetUsername} restablecido con éxito por @${adminUsername}.`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`Nivel de spam de @${targetUsername} reducido de *${beforeLabel}* → *${afterLabel}* con éxito por @${adminUsername}.`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} restablecido a *Clean* con éxito por @${adminUsername}.`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: 'Avalar Usuario',
		description:
			'Esto marcará al usuario como *de confianza* y lo eximirá por completo del monitoreo de spam.',
		confirmLabel: 'Confirmar Aval',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: 'Restablecer Período de Espera',
		description:
			'Esto levantará de inmediato el período de espera/timeout activo de este usuario.',
		confirmLabel: 'Restablecer Período de Espera',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: 'Bajar de Nivel',
		description: 'Esto reducirá el nivel de spam en un escalón.',
		confirmLabel: 'Bajar de Nivel',
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: 'Restablecer a Clean',
		description:
			'Esto restablecerá de inmediato el nivel de spam a *Clean*, eliminando todas las restricciones.',
		confirmLabel: 'Restablecer a Clean',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*Configurar comportamiento del nivel* — elige un nivel, define qué ' +
		'hace el bot cuando un usuario llega a él y, opcionalmente, personaliza ' +
		'el mensaje que se le envía. Deja el mensaje en blanco para usar el predeterminado.',
	levelOverviewModalHeader:
		'*Configuración de Nivel de Spam*\n' +
		'Revisa a continuación el comportamiento de cada nivel. ' +
		'Pulsa *Editar* para cambiar la acción, el timeout o el mensaje de notificación de un nivel.',
	timeoutLabel:
		'Duración del timeout (segundos) — solo se usa cuando la acción es "Timeout"',
	customNotificationLabel:
		'Mensaje de notificación personalizado, usa {user} y {duration} como marcadores - (déjalo en blanco para el predeterminado)',
	customNotificationHint: `Déjalo en blanco para usar el mensaje predeterminado que se muestra en el marcador.`,
	defaultNotificationInputPlaceholder:
		'Mensaje enviado al usuario cuando se activa este nivel...',
};

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`No se detectaron cambios para *${levelLabel(level)}*.`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`Configuración de nivel actualizada* por @${adminUsername}*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`Configuración de nivel guardada con éxito por @${adminUsername}`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}* ha sido restablecido a su configuración predeterminada por @${adminUsername}.`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: 'Confirmar Acción',
		description: '¿Seguro que quieres realizar esta acción?',
		confirmLabel: 'Confirmar',
	},
	LevelResetToDefault: {
		title: 'Restablecer a Valores Predeterminados',
		description:
			'¿Seguro que quieres restablecer la acción, el timeout y el mensaje de este nivel a los valores predeterminados? Esto no se puede deshacer.',
		confirmLabel: 'Restablecer',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} configuró el horario de informes de usuarios marcados para este canal.`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} eliminó el horario de informes de usuarios marcados para este canal. No se enviarán más informes automáticos.`,
};

export const dailyReportNotification = {
	title: (dateStr: string) => `**Informe Diario Antispam** — ${dateStr}`,

	allClear: {
		heading: '**Todo Despejado** — sin actividad de spam en este período.',
		flagsLine: '• Marcas: 0',
		flaggedUsersLine: '• Usuarios marcados: 0',
		trackedUsersLine: (count: number) => `• Usuarios rastreados: ${count}`,
	},

	summary: {
		heading: '**Resumen:**',
		flagsLine: (count: number) => `• Marcas en este período: ${count}`,
		flaggedUsersLine: (count: number) =>
			`• Usuarios marcados actualmente: ${count}`,
		adminActionsLine: (count: number) =>
			`• Acciones administrativas en este período: ${count}`,
		trackedUsersLine: (count: number) =>
			`• Total de usuarios rastreados: ${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}** (${count}):`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — ${totalFlags} marcas en total`,
	},

	flaggedUsers: {
		heading: '**Usuarios Marcados (en este período):**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} marcas (${triggerList}) — actualmente: ${currentLabel}`,
		rooms: (roomsList: string) => `      _Salas: ${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _Salas: ${roomsList} (+más, mostrando las primeras ${MAX_ROOMS_PER_SUMMARY})_`,
	},

	adminActions: {
		heading: '**Acciones Administrativas (en este período):**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label} por @${adminUsername}`,
	},

	moreCount: (n: number) => `  _...y ${n} más_`,
};

export const scheduleSetupModalText = {
	everyDay: 'Todos los días',
	days: {
		sun: 'Dom',
		mon: 'Lun',
		tue: 'Mar',
		wed: 'Mié',
		thu: 'Jue',
		fri: 'Vie',
		sat: 'Sáb',
	},
	cadenceLabels: {
		daily: 'Diario',
		weekdays: 'Días laborables',
		weekly: 'Semanal',
		custom: 'Personalizado',
	},
	setup: {
		headerDefault:
			'Configura cuándo se enviará el informe de usuarios marcados a este canal.',
		headerExisting: (desc: string) =>
			`*Horario actual:* ${desc}\n\nConfigura un reemplazo a continuación — esto sobrescribirá el horario existente al confirmarlo.`,
		deleteButton: 'Eliminar horario actual',
		cadenceLabel: 'Frecuencia',
		cadencePlaceholder: 'Selecciona la frecuencia',
		cadenceHint:
			'*Diario:* todos los días  ·  *Días laborables:* Lun–Vie  ·  *Semanal:* todos los lunes\n*Personalizado:* elige los días exactos a continuación (solo se usa cuando Frecuencia = Personalizado).',
		daysLabel: 'Días (solo para frecuencia Personalizado)',
		daysPlaceholder: 'Selecciona los días',
		timeLabel: 'Hora',
		title: 'Programar Informe',
		previewButton: 'Vista Previa',
	},
	confirm: {
		title: 'Confirmar Horario',
		backButton: '← Atrás',
		confirmButton: 'Confirmar y Programar',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*Frecuencia:* ${cadence}\n` +
			`*Días:* ${days}\n` +
			`*Hora:* ${time} (${offset})\n\n` +
			`*Próxima ejecución:* ${nextRun}` +
			(hadExisting ? `\n\n_Esto reemplazará el horario existente._` : ''),
	},
	delete: {
		title: 'Eliminar Horario',
		confirmButton: 'Eliminar Horario',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*Horario existente:*\n` +
			`*Frecuencia:* ${cadence}\n` +
			`*Días:* ${days}\n` +
			`*Hora:* ${time} (${offset})\n\n` +
			`*Esto detendrá y eliminará el trabajo de programación en ejecución. No se enviarán más informes automáticos hasta que se configure un nuevo horario.*`,
	},
};

export const scheduleValidationText = {
	invalidTime: 'Introduce una hora válida en formato HH:MM, p. ej. 09:00',
	missingCustomDays:
		'Selecciona al menos un día para la frecuencia Personalizado.',
};
export const whitelistModalText = {
	whitelistModalTitle: 'Lista Blanca de Spam Monitor',
	whitelistModalSubTitle:
		'Los canales y roles listados aquí quedan totalmente excluidos del monitoreo de spam — sin detección, sin restricciones. Edita cualquiera de las listas y pulsa Guardar; todo lo que se elimine de una lista dejará de estar en la lista blanca.',
	channelListLabel: 'Canales en la lista blanca (separados por comas)',
	roleListLabel: 'Roles en la lista blanca (separados por comas)',
	channelListInputPlaceholder: 'general, aleatorio, soporte',
	roleListInputPlaceholder: 'moderador, admin, equipo-soporte',
	channelListInputHint:
		'*Los nombres de los canales distinguen entre mayúsculas y minúsculas — escríbelos exactamente como aparecen en Rocket.Chat (p. ej. "general", no "General").' +
		'\n' +
		'Si no estás seguro de las mayúsculas o minúsculas de un nombre de canal, consulta la lista de canales en Rocket.Chat.',
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
				`Se añadió(eron) ${addedChannels.map((c) => `#${c}`).join(', ')} a la lista blanca.`,
			);
		}
		if (removedChannels.length > 0) {
			parts.push(
				`Se eliminó(aron) ${removedChannels.map((c) => `#${c}`).join(', ')} de la lista blanca.`,
			);
		}
		if (addedRoles.length > 0) {
			parts.push(
				`Se añadió(eron) el/los rol(es) ${addedRoles.map((r) => `\`${r}\``).join(', ')} a la lista blanca.`,
			);
		}
		if (removedRoles.length > 0) {
			parts.push(
				`Se eliminó(aron) el/los rol(es) ${removedRoles.map((r) => `\`${r}\``).join(', ')} de la lista blanca.`,
			);
		}
		if (notFoundChannels.length > 0) {
			parts.push(
				`No se pudo(pudieron) encontrar: ${notFoundChannels.map((c) => `#${c}`).join(', ')}. Revisa si los nombres de los canales tienen mayúsculas.`,
			);
		}
		if (parts.length === 0) {
			return 'Lista blanca de spam monitor guardada — sin cambios.';
		}
		return `Lista blanca de spam monitor actualizada. ${parts.join(' ')}`;
	},
};
export const configModalText = {
	title: 'Configuración de SpamMonitor',
	header: 'Elige una sección a continuación para configurar.',
	configureButton: 'Configurar',
};
export const slashNotifications = {
	NO_FLAGGED_USERS: 'No hay usuarios marcados en este momento.',
	NO_PERMISSION: 'No tienes permiso para usar este comando.',
	ADMIN_CHANNEL_ONLY:
		'Este comando solo se puede usar en el canal de administración.',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`No se encontraron usuarios marcados para el filtro: *${filter}*.`,
	USER_NOT_FOUND: (username: string) =>
		`Usuario *@${username}* no encontrado o sin registro de spam.`,
	MANAGE_MISSING_USERNAME: 'Uso: `/spammonitor manage <username>`',
	LEVEL_MISSING_LEVEL: 'Uso: `/spammonitor level`',
	SCHEDULE_MISSING_TRIGGER: 'Uso: `/spammonitor schedule`',
	CONFIG_MISSING_TRIGGER: 'Uso: `/spammonitor config`',
};

export const slashCommandHelp = {
	HELP:
		'*Comandos de SpamMonitor*\n' +
		'`/spammonitor list all` — todos los usuarios marcados, del nivel más alto al más bajo\n' +
		'`/spammonitor list timeout` — usuarios actualmente en un período de espera activo\n' +
		'`/spammonitor list <Level>` — usuarios en un nivel específico, p. ej. `list review` para usuarios en revisión administrativa\n' +
		'`/spammonitor manage <username>` — abrir los controles administrativos de un usuario marcado\n' +
		'`/spammonitor level` — configurar la acción y la notificación por nivel de spam\n' +
		'`/spammonitor schedule` — configurar el informe diario antispam\n' +
		'`/spammonitor config` — configurar la lista blanca de canales y roles exentos del monitoreo de spam',
};

export const languageModalText = {
	title: 'Configuración de Idioma',
	header: 'Selecciona tu idioma preferido para los mensajes del bot, los modales y las notificaciones.',
	selectLabel: 'Idioma',
	selectPlaceholder: 'Elige un idioma',
};

export const commonModalText = {
	cancel: 'Cancelar',
	submit: 'Enviar',
	edit: 'Editar',
	close: 'Cerrar',
	save: 'Guardar',
};
export const languageNotification = {
	LanguageChanged: (languageLabel: string) =>
		`Tu preferencia de idioma se ha cambiado a *${languageLabel}*.`,
};

export const EditLevelModalStrings = {
	modalTitle: (levelLabelText: string) => `Editar — ${levelLabelText}`,
	headerTitle: (levelLabelText: string) => `*Editando: ${levelLabelText}*`,
	backToOverviewButton: '← Volver a la Vista General',
	resetToDefaultButton: 'Restablecer a Valores Predeterminados',
	actionSelectLabel: 'Acción',
	actionSelectPlaceholder: 'Selecciona una acción',
	timeoutPlaceholder: (defaultTimeout: number) => `p. ej. ${defaultTimeout}`,
};
export const LevelOverviewModalStrings = {
	modalTitle: 'Configuración de Nivel',
	actionSummaryPrefix: (levelLabelText: string, actionSummary: string) =>
		`*${levelLabelText}*\nAcción: ${actionSummary}`,
	messagePreviewPrefix: (messagePreview: string) =>
		`Mensaje: ${messagePreview}`,
	noCustomMessage: '_Sin mensaje personalizado (se usa el predeterminado)_',
	messagePreviewTruncated: (preview: string) => `_"${preview}…"_`,
	messagePreviewFull: (preview: string) => `_"${preview}"_`,
};
export const ManageUserModalStrings = {
	modalTitle: (username: string) => `Gestionar a @${username}`,
	userLabel: (username: string) => `*Usuario:* @${username}`,
	spamLevelFieldLabel: (levelLabelText: string) =>
		`*Nivel de Spam:*\n${levelLabelText}`,
	cooldownFieldLabel: (cooldownText: string) =>
		`*Período de Espera:*\n${cooldownText}`,
	lastEscalationFieldLabel: (dateText: string) =>
		`*Última Escalada:*\n${dateText}`,
	actionsHeader: '*Acciones Administrativas*',
	vouchButtonFallback: 'Avalar',
	resetCooldownButtonFallback: 'Restablecer Período de Espera',
	levelDownButtonFallback: 'Bajar de Nivel',
	resetToCleanButtonFallback: 'Restablecer a Clean',
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
		`Total marcados: *${total}* | ` +
		`Monitoreados: *${monitored}* | ` +
		`Restringidos: *${restricted}* | ` +
		`Suspendidos: *${suspended}* | ` +
		`Pendientes de revisión: *${adminReview}* | ` +
		`En período de espera: *${timedOut}*`,
	userRowLine: (username: string, label: string, cooldownStr: string) =>
		`@${username} — *${label}*${cooldownStr}`,
	cooldownSuffix: (formattedDate: string) =>
		` | en período de espera hasta ${formattedDate} UTC`,
	manageUserOverflowOption: 'Gestionar usuario',
	listHeader: (summary: string, title: string) => `${summary}\n\n*${title}*`,
	listTitleSuffix: (title: string) => `Usuarios ${title}`,
	allFlaggedUsersTitle: 'Todos los Usuarios Marcados',
	pendingAdminReviewTitle: 'Pendiente de Revisión Administrativa',
	unknownLevelError: (levelName: string, validLevels: string) =>
		`Nivel desconocido *${levelName}*. Niveles válidos: ${validLevels}.\n` +
		`Para usuarios en revisión administrativa, usa \`list review\`.`,
	activeTimeoutTitle: 'Usuarios en Período de Espera Activo',
	activeTimeoutFilterKey: 'período de espera activo',
};
export const configEntriesText = {
	whitelist: {
		label: 'Lista blanca',
		description:
			'Canales y roles completamente excluidos de la supervisión de spam.',
	},
	language: {
		label: 'Idioma',
		description:
			'Elige el idioma utilizado para los mensajes y modales del bot.',
	},
};
