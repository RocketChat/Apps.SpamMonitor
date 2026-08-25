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
		`Bonjour @${username}, nous avons remarqué une activité inhabituelle sur ton compte.\n\nTes messages sont désormais surveillés. Merci de ralentir et d'éviter d'envoyer des messages répétés ou identiques dans plusieurs salons.\n\nSi cela continue, des restrictions supplémentaires pourront être appliquées.`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}, ton compte a été placé en période de restriction pour ${duration}.\n\nTu ne pourras pas envoyer de messages pendant cette période. Cela a été déclenché par un comportement signalé de manière répétée.\n\nLa restriction sera levée automatiquement une fois la période de restriction écoulée.`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}, ton compte a été suspendu de l'envoi de messages pendant ${duration}.\n\nCeci est dû à un comportement continu de type spam après des avertissements précédents. Tes messages seront bloqués jusqu'à la fin de la période de suspension.\n\nSi tu penses qu'il s'agit d'une erreur, contacte un administrateur.`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}, ton compte a été signalé pour une révision par un administrateur.\n\nTu es actuellement empêché d'envoyer des messages jusqu'à ce qu'un administrateur examine ton compte et lève la restriction.\n\nMerci de contacter directement un administrateur si tu as besoin d'une assistance immédiate.`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**Panneau d'administration SpamMonitor**\n\n` +
		`Ceci est le salon d'administration dédié à l'application SpamMonitor. ` +
		`Toutes les commandes slash doivent être exécutées depuis ce salon.\n\n` +
		`---\n\n` +
		`**Niveaux de spam et actions par défaut** \n` +
		`• \`Clean\` — Aucun problème détecté\n` +
		`• \`Monitored\` — Activité inhabituelle signalée ; l'utilisateur est surveillé\n` +
		`• \`Restricted\` — Utilisateur placé en période de restriction limitée dans le temps\n` +
		`• \`Suspended\` — Utilisateur suspendu pour une période plus longue\n` +
		`• \`AdminReview\` — Entièrement bloqué ; en attente d'une action manuelle d'un administrateur\n\n` +
		`---\n\n` +
		`**Commandes disponibles** (\`/spammonitor <sous-commande>\`)\n` +
		`• \`list\` — Afficher tous les utilisateurs actuellement signalés\n` +
		`• \`manage <username>\` — Ouvrir les commandes d'administration pour un utilisateur signalé\n` +
		`• \`level\` — Configurer l'action et la notification pour chaque niveau de spam\n\n` +
		`• \`schedule\` — Configurer la planification des rapports de spam programmés\n\n` +
		`• \`config\` — Configurer les paramètres de SpamMonitor, comme la liste blanche des salons et des rôles\n\n` +
		`• \`help\` — Afficher ce message d'aide\n\n` +
		`---\n\n` +
		`**Configurer les paramètres**\n` +
		`_Configure les seuils et les fenêtres temporelles dans Marketplace → Private Apps → Apps.SpamMonitor._`,

	installDm: (channelName: string) =>
		`**SpamMonitor installé !**\n\n` +
		`Un salon de panneau d'administration \`#${channelName}\` a été créé.\n` +
		`Toutes les commandes slash sont limitées à ce salon uniquement.\n` +
		`Configure les paramètres dans *Marketplace → Private Apps → Apps.SpamMonitor*.`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor désinstallé.**\n\n` +
		`Le salon \`#${channelName}\` a été supprimé.`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} a été garanti avec succès par @${adminUsername} — désormais entièrement exempté de la surveillance anti-spam.`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`Période de restriction de @${targetUsername} réinitialisée avec succès par @${adminUsername}.`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`Niveau de spam de @${targetUsername} réduit de *${beforeLabel}* → *${afterLabel}* avec succès par @${adminUsername}.`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} réinitialisé à *Clean* avec succès par @${adminUsername}.`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: "Garantir l'utilisateur",
		description:
			"Cela marquera l'utilisateur comme *de confiance* et l'exemptera entièrement de la surveillance anti-spam.",
		confirmLabel: 'Confirmer la garantie',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: 'Réinitialiser la période de restriction',
		description:
			'Cela lèvera immédiatement la période de restriction/timeout active de cet utilisateur.',
		confirmLabel: 'Réinitialiser la période de restriction',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: "Baisser d'un niveau",
		description: "Cela réduira le niveau de spam d'un cran.",
		confirmLabel: "Baisser d'un niveau",
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: 'Réinitialiser à Clean',
		description:
			'Cela réinitialisera immédiatement le niveau de spam à *Clean*, en supprimant toutes les restrictions.',
		confirmLabel: 'Réinitialiser à Clean',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*Configurer le comportement du niveau* — choisis un niveau, définis ce ' +
		"que fait le bot lorsqu'un utilisateur l'atteint, et personnalise éventuellement " +
		'le message qui lui est envoyé. Laisse le message vide pour utiliser le message par défaut.',
	levelOverviewModalHeader:
		'*Configuration des niveaux de spam*\n' +
		'Consulte ci-dessous le comportement de chaque niveau. ' +
		"Clique sur *Modifier* pour changer l'action, le timeout ou le message de notification d'un niveau.",
	timeoutLabel:
		"Durée du timeout (secondes) — utilisée uniquement lorsque l'action est « Timeout »",
	customNotificationLabel:
		'Message de notification personnalisé, utilise {user} et {duration} comme paramètres substituables - (laisse vide pour le message par défaut)',
	customNotificationHint: `Laisse vide pour utiliser le message par défaut affiché dans le paramètre substituable.`,
	defaultNotificationInputPlaceholder:
		"Message envoyé à l'utilisateur lorsque ce niveau est déclenché...",
};

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`Aucun changement détecté pour *${levelLabel(level)}*.`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`Configuration du niveau mise à jour* par @${adminUsername}*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`Configuration du niveau enregistrée avec succès par @${adminUsername}`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}* a été réinitialisé à ses paramètres par défaut par @${adminUsername}.`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: "Confirmer l'action",
		description: 'Es-tu sûr(e) de vouloir effectuer cette action ?',
		confirmLabel: 'Confirmer',
	},
	LevelResetToDefault: {
		title: 'Réinitialiser aux valeurs par défaut',
		description:
			"Es-tu sûr(e) de vouloir réinitialiser l'action, le timeout et le message de ce niveau aux valeurs par défaut ? Cette opération est irréversible.",
		confirmLabel: 'Réinitialiser',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} a configuré la planification des rapports d'utilisateurs signalés pour ce salon.`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} a supprimé la planification des rapports d'utilisateurs signalés pour ce salon. Plus aucun rapport automatique ne sera envoyé.`,
};

export const dailyReportNotification = {
	title: (dateStr: string) => `**Rapport anti-spam quotidien** — ${dateStr}`,

	allClear: {
		heading:
			'**Tout est clair** — aucune activité de spam durant cette période.',
		flagsLine: '• Signalements : 0',
		flaggedUsersLine: '• Utilisateurs signalés : 0',
		trackedUsersLine: (count: number) => `• Utilisateurs suivis : ${count}`,
	},

	summary: {
		heading: '**Résumé :**',
		flagsLine: (count: number) =>
			`• Signalements sur cette période : ${count}`,
		flaggedUsersLine: (count: number) =>
			`• Utilisateurs actuellement signalés : ${count}`,
		adminActionsLine: (count: number) =>
			`• Actions administratives sur cette période : ${count}`,
		trackedUsersLine: (count: number) =>
			`• Total des utilisateurs suivis : ${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}** (${count}) :`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — ${totalFlags} signalements au total`,
	},

	flaggedUsers: {
		heading: '**Utilisateurs signalés (sur cette période) :**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} signalements (${triggerList}) — actuellement : ${currentLabel}`,
		rooms: (roomsList: string) => `      _Salons : ${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _Salons : ${roomsList} (+ plus, affichage des ${MAX_ROOMS_PER_SUMMARY} premiers)_`,
	},

	adminActions: {
		heading: '**Actions administratives (sur cette période) :**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label} par @${adminUsername}`,
	},

	moreCount: (n: number) => `  _...et ${n} de plus_`,
};

export const scheduleSetupModalText = {
	everyDay: 'Tous les jours',
	days: {
		sun: 'Dim',
		mon: 'Lun',
		tue: 'Mar',
		wed: 'Mer',
		thu: 'Jeu',
		fri: 'Ven',
		sat: 'Sam',
	},
	cadenceLabels: {
		daily: 'Quotidien',
		weekdays: 'Jours ouvrés',
		weekly: 'Hebdomadaire',
		custom: 'Personnalisé',
	},
	setup: {
		headerDefault:
			'Configure quand le rapport des utilisateurs signalés doit être envoyé à ce salon.',
		headerExisting: (desc: string) =>
			`*Planification actuelle :* ${desc}\n\nConfigure un remplacement ci-dessous — cela remplacera la planification existante une fois confirmé.`,
		deleteButton: 'Supprimer la planification actuelle',
		cadenceLabel: 'Fréquence',
		cadencePlaceholder: 'Sélectionne la fréquence',
		cadenceHint:
			'*Quotidien :* tous les jours  ·  *Jours ouvrés :* lun.–ven.  ·  *Hebdomadaire :* tous les lundis\n*Personnalisé :* choisis les jours exacts ci-dessous (utilisé uniquement lorsque Fréquence = Personnalisé).',
		daysLabel: 'Jours (fréquence Personnalisé uniquement)',
		daysPlaceholder: 'Sélectionne les jours',
		timeLabel: 'Heure',
		title: 'Planifier le rapport',
		previewButton: 'Aperçu',
	},
	confirm: {
		title: 'Confirmer la planification',
		backButton: '← Retour',
		confirmButton: 'Confirmer et planifier',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*Fréquence :* ${cadence}\n` +
			`*Jours :* ${days}\n` +
			`*Heure :* ${time} (${offset})\n\n` +
			`*Prochaine exécution :* ${nextRun}` +
			(hadExisting
				? `\n\n_Cela remplacera la planification existante._`
				: ''),
	},
	delete: {
		title: 'Supprimer la planification',
		confirmButton: 'Supprimer la planification',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*Planification existante :*\n` +
			`*Fréquence :* ${cadence}\n` +
			`*Jours :* ${days}\n` +
			`*Heure :* ${time} (${offset})\n\n` +
			`*Cela arrêtera et supprimera la tâche planifiée en cours d'exécution. Plus aucun rapport automatique ne sera envoyé tant qu'une nouvelle planification ne sera pas configurée.*`,
	},
};

export const scheduleValidationText = {
	invalidTime: 'Saisis une heure valide au format HH:MM, ex. 09:00',
	missingCustomDays:
		'Sélectionne au moins un jour pour la fréquence Personnalisé.',
};
export const whitelistModalText = {
	whitelistModalTitle: 'Liste blanche de SpamMonitor',
	whitelistModalSubTitle:
		"Les salons et les rôles listés ici sont entièrement exclus de la surveillance anti-spam — aucune détection, aucune restriction. Modifie l'une ou l'autre des listes et clique sur Enregistrer ; tout élément retiré d'une liste perdra son statut de liste blanche.",
	channelListLabel: 'Salons en liste blanche (séparés par des virgules)',
	roleListLabel: 'Rôles en liste blanche (séparés par des virgules)',
	channelListInputPlaceholder: 'general, aleatoire, support',
	roleListInputPlaceholder: 'moderateur, admin, equipe-support',
	channelListInputHint:
		'*Les noms de salons sont sensibles à la casse — saisis-les exactement comme ils apparaissent dans Rocket.Chat (par ex. « general », et non « General »).' +
		'\n' +
		"Si tu n'es pas sûr(e) de la casse d'un nom de salon, vérifie la liste des salons dans Rocket.Chat.",
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
				`${addedChannels.map((c) => `#${c}`).join(', ')} ajouté(s) à la liste blanche.`,
			);
		}
		if (removedChannels.length > 0) {
			parts.push(
				`${removedChannels.map((c) => `#${c}`).join(', ')} retiré(s) de la liste blanche.`,
			);
		}
		if (addedRoles.length > 0) {
			parts.push(
				`Rôle(s) ${addedRoles.map((r) => `\`${r}\``).join(', ')} ajouté(s) à la liste blanche.`,
			);
		}
		if (removedRoles.length > 0) {
			parts.push(
				`Rôle(s) ${removedRoles.map((r) => `\`${r}\``).join(', ')} retiré(s) de la liste blanche.`,
			);
		}
		if (notFoundChannels.length > 0) {
			parts.push(
				`Introuvable(s) : ${notFoundChannels.map((c) => `#${c}`).join(', ')}. Vérifie la présence de majuscules dans les noms de salons.`,
			);
		}
		if (parts.length === 0) {
			return 'Liste blanche de SpamMonitor enregistrée — aucun changement.';
		}
		return `Liste blanche de SpamMonitor mise à jour. ${parts.join(' ')}`;
	},
};
export const configModalText = {
	title: 'Configuration de SpamMonitor',
	header: 'Choisis une section ci-dessous à configurer.',
	configureButton: 'Configurer',
};
export const slashNotifications = {
	NO_FLAGGED_USERS: 'Aucun utilisateur signalé pour le moment.',
	NO_PERMISSION: "Tu n'as pas la permission d'utiliser cette commande.",
	ADMIN_CHANNEL_ONLY:
		"Cette commande ne peut être utilisée que dans le salon d'administration.",
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`Aucun utilisateur signalé trouvé pour le filtre : *${filter}*.`,
	USER_NOT_FOUND: (username: string) =>
		`Utilisateur *@${username}* introuvable ou sans historique de spam.`,
	MANAGE_MISSING_USERNAME: 'Utilisation : `/spammonitor manage <username>`',
	LEVEL_MISSING_LEVEL: 'Utilisation : `/spammonitor level`',
	SCHEDULE_MISSING_TRIGGER: 'Utilisation : `/spammonitor schedule`',
	CONFIG_MISSING_TRIGGER: 'Utilisation : `/spammonitor config`',
};

export const slashCommandHelp = {
	HELP:
		'*Commandes SpamMonitor*\n' +
		'`/spammonitor list all` — tous les utilisateurs signalés, du niveau le plus élevé au plus bas\n' +
		'`/spammonitor list timeout` — utilisateurs actuellement en période de restriction active\n' +
		'`/spammonitor list <Level>` — utilisateurs à un niveau spécifique, ex. `list review` pour les utilisateurs en révision administrative\n' +
		"`/spammonitor manage <username>` — ouvrir les commandes d'administration pour un utilisateur signalé\n" +
		"`/spammonitor level` — configurer l'action et la notification pour chaque niveau de spam\n" +
		'`/spammonitor schedule` — configurer le rapport anti-spam quotidien\n' +
		'`/spammonitor config` — configurer la liste blanche des salons et rôles exemptés de la surveillance anti-spam',
};

export const languageModalText = {
	title: 'Paramètres de langue',
	header: 'Sélectionne ta langue préférée pour les messages du bot, les fenêtres modales et les notifications.',
	selectLabel: 'Langue',
	selectPlaceholder: 'Choisis une langue',
};

export const commonModalText = {
	cancel: 'Annuler',
	submit: 'Envoyer',
	edit: 'Modifier',
	close: 'Fermer',
	save: 'Enregistrer',
};
export const languageNotification = {
	LanguageChanged: (languageLabel: string) =>
		`Ta préférence de langue a été changée en *${languageLabel}*.`,
};

export const EditLevelModalStrings = {
	modalTitle: (levelLabelText: string) => `Modifier — ${levelLabelText}`,
	headerTitle: (levelLabelText: string) =>
		`*Modification : ${levelLabelText}*`,
	backToOverviewButton: "← Retour à la vue d'ensemble",
	resetToDefaultButton: 'Réinitialiser aux valeurs par défaut',
	actionSelectLabel: 'Action',
	actionSelectPlaceholder: 'Sélectionne une action',
	timeoutPlaceholder: (defaultTimeout: number) => `ex. ${defaultTimeout}`,
};
export const LevelOverviewModalStrings = {
	modalTitle: 'Configuration des niveaux',
	actionSummaryPrefix: (levelLabelText: string, actionSummary: string) =>
		`*${levelLabelText}*\nAction : ${actionSummary}`,
	messagePreviewPrefix: (messagePreview: string) =>
		`Message : ${messagePreview}`,
	noCustomMessage:
		'_Aucun message personnalisé (message par défaut utilisé)_',
	messagePreviewTruncated: (preview: string) => `_« ${preview}… »_`,
	messagePreviewFull: (preview: string) => `_« ${preview} »_`,
};
export const ManageUserModalStrings = {
	modalTitle: (username: string) => `Gérer @${username}`,
	userLabel: (username: string) => `*Utilisateur :* @${username}`,
	spamLevelFieldLabel: (levelLabelText: string) =>
		`*Niveau de spam :*\n${levelLabelText}`,
	cooldownFieldLabel: (cooldownText: string) =>
		`*Période de restriction :*\n${cooldownText}`,
	lastEscalationFieldLabel: (dateText: string) =>
		`*Dernière escalade :*\n${dateText}`,
	actionsHeader: '*Actions administratives*',
	vouchButtonFallback: 'Garantir',
	resetCooldownButtonFallback: 'Réinitialiser la période de restriction',
	levelDownButtonFallback: "Baisser d'un niveau",
	resetToCleanButtonFallback: 'Réinitialiser à Clean',
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
		`Total signalés : *${total}* | ` +
		`Surveillés : *${monitored}* | ` +
		`Restreints : *${restricted}* | ` +
		`Suspendus : *${suspended}* | ` +
		`En attente de révision : *${adminReview}* | ` +
		`En période de restriction : *${timedOut}*`,
	userRowLine: (username: string, label: string, cooldownStr: string) =>
		`@${username} — *${label}*${cooldownStr}`,
	cooldownSuffix: (formattedDate: string) =>
		` | en restriction jusqu'au ${formattedDate} UTC`,
	manageUserOverflowOption: "Gérer l'utilisateur",
	listHeader: (summary: string, title: string) => `${summary}\n\n*${title}*`,
	listTitleSuffix: (title: string) => `Utilisateurs ${title}`,
	allFlaggedUsersTitle: 'Tous les utilisateurs signalés',
	pendingAdminReviewTitle: 'En attente de révision administrative',
	unknownLevelError: (levelName: string, validLevels: string) =>
		`Niveau inconnu *${levelName}*. Niveaux valides : ${validLevels}.\n` +
		`Pour les utilisateurs en révision administrative, utilise \`list review\`.`,
	activeTimeoutTitle: 'Utilisateurs en période de restriction active',
	activeTimeoutFilterKey: 'période de restriction active',
};
export const configEntriesText = {
	whitelist: {
		label: 'Liste blanche',
		description:
			'Canaux et rôles entièrement exclus de la surveillance anti-spam.',
	},
	language: {
		label: 'Langue',
		description:
			'Choisissez la langue utilisée pour les messages et les fenêtres modales du bot.',
	},
};
