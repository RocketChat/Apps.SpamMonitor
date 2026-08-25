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
		`Hallo @${username}, uns ist ungewöhnliche Aktivität auf deinem Konto aufgefallen.\n\nDeine Nachrichten werden überwacht. Bitte verlangsame dein Tempo und vermeide es, wiederholte oder identische Nachrichten in mehreren Kanälen zu senden.\n\nWenn dies weiterhin geschieht, können weitere Einschränkungen verhängt werden.`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}, dein Konto wurde für ${duration} in eine Abklingzeit versetzt.\n\nDu kannst in diesem Zeitraum keine Nachrichten senden. Dies wurde durch wiederholt markiertes Verhalten ausgelöst.\n\nDie Einschränkung wird automatisch aufgehoben, sobald die Abklingzeit abgelaufen ist.`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}, dein Konto wurde für ${duration} vom Versenden von Nachrichten gesperrt.\n\nDies ist auf anhaltendes spamähnliches Verhalten nach vorherigen Warnungen zurückzuführen. Deine Nachrichten werden bis zum Ende der Sperrzeit blockiert.\n\nWenn du glaubst, dass dies ein Irrtum ist, wende dich bitte an einen Administrator.`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}, dein Konto wurde zur Überprüfung durch einen Administrator markiert.\n\nDu bist derzeit vom Senden von Nachrichten ausgeschlossen, bis ein Administrator dein Konto überprüft und die Einschränkung aufhebt.\n\nBitte wende dich direkt an einen Administrator, wenn du sofortige Unterstützung benötigst.`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**SpamMonitor Admin-Panel**\n\n` +
		`Dies ist der dedizierte Admin-Kanal für die SpamMonitor-App. ` +
		`Alle Slash-Befehle müssen von diesem Kanal aus ausgeführt werden.\n\n` +
		`---\n\n` +
		`**Spam-Level und Standardaktionen** \n` +
		`• \`Clean\` — Keine Probleme erkannt\n` +
		`• \`Monitored\` — Ungewöhnliche Aktivität markiert; Benutzer wird beobachtet\n` +
		`• \`Restricted\` — Benutzer in eine zeitlich begrenzte Abklingzeit versetzt\n` +
		`• \`Suspended\` — Benutzer für einen längeren Zeitraum gesperrt\n` +
		`• \`AdminReview\` — Vollständig blockiert; wartet auf manuelle Admin-Aktion\n\n` +
		`---\n\n` +
		`**Verfügbare Befehle** (\`/spammonitor <Unterbefehl>\`)\n` +
		`• \`list\` — Alle derzeit markierten Benutzer anzeigen\n` +
		`• \`manage <username>\` — Admin-Steuerung für einen markierten Benutzer öffnen\n` +
		`• \`level\` — Aktion und Benachrichtigung pro Spam-Level konfigurieren\n\n` +
		`• \`schedule\` — Zeitplan für geplante Spam-Berichte konfigurieren\n\n` +
		`• \`config\` — SpamMonitor-Einstellungen wie Kanal- und Rollen-Whitelist konfigurieren\n\n` +
		`• \`help\` — Diese Hilfemeldung anzeigen\n\n` +
		`---\n\n` +
		`**Einstellungen konfigurieren**\n` +
		`_Konfiguriere Schwellenwerte und Zeitfenster unter Marketplace → Private Apps → Apps.SpamMonitor._`,

	installDm: (channelName: string) =>
		`**SpamMonitor installiert!**\n\n` +
		`Ein Admin-Panel-Kanal \`#${channelName}\` wurde erstellt.\n` +
		`Alle Slash-Befehle sind ausschließlich auf diesen Kanal beschränkt.\n` +
		`Konfiguriere die Einstellungen unter *Marketplace → Private Apps → Apps.SpamMonitor*.`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor deinstalliert.**\n\n` +
		`Der Kanal \`#${channelName}\` wurde entfernt.`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} wurde erfolgreich von @${adminUsername} bestätigt — jetzt vollständig von der Spam-Überwachung ausgenommen.`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`Abklingzeit für @${targetUsername} erfolgreich von @${adminUsername} zurückgesetzt.`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`Spam-Level für @${targetUsername} erfolgreich von *${beforeLabel}* → *${afterLabel}* von @${adminUsername} reduziert.`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} erfolgreich von @${adminUsername} auf *Clean* zurückgesetzt.`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: 'Für Benutzer bürgen',
		description:
			'Dadurch wird der Benutzer als *vertrauenswürdig* markiert und vollständig von der Spam-Überwachung ausgenommen.',
		confirmLabel: 'Bürgschaft bestätigen',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: 'Abklingzeit zurücksetzen',
		description:
			'Dadurch wird die aktive Abklingzeit/Auszeit für diesen Benutzer sofort aufgehoben.',
		confirmLabel: 'Abklingzeit zurücksetzen',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: 'Level herabstufen',
		description: 'Dadurch wird der Spam-Level um eine Stufe reduziert.',
		confirmLabel: 'Level herabstufen',
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: 'Auf Clean zurücksetzen',
		description:
			'Dadurch wird der Spam-Level sofort auf *Clean* zurückgesetzt und alle Einschränkungen werden entfernt.',
		confirmLabel: 'Auf Clean zurücksetzen',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*Level-Verhalten konfigurieren* — wähle einen Level, lege fest, ' +
		'was der Bot tut, wenn ein Benutzer diesen Level erreicht, und passe optional ' +
		'die an ihn gesendete Nachricht an. Lasse die Nachricht leer, um die Standardnachricht zu verwenden.',
	levelOverviewModalHeader:
		'*Spam-Level-Konfiguration*\n' +
		'Überprüfe unten das Verhalten jedes Levels. ' +
		'Klicke auf *Bearbeiten*, um die Aktion, das Timeout oder die Benachrichtigungsnachricht eines Levels zu ändern.',
	timeoutLabel:
		'Timeout-Dauer (Sekunden) — nur verwendet, wenn die Aktion "Timeout" ist',
	customNotificationLabel:
		'Benutzerdefinierte Benachrichtigungsnachricht, verwende {user} und {duration} als Platzhalter - (leer lassen für Standard)',
	customNotificationHint: `Leer lassen, um die im Platzhalter angezeigte Standardnachricht zu verwenden.`,
	defaultNotificationInputPlaceholder:
		'Nachricht, die an den Benutzer gesendet wird, wenn dieser Level ausgelöst wird...',
};

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`Keine Änderungen für *${levelLabel(level)}* erkannt.`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`Level-Konfiguration aktualisiert* von @${adminUsername}*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`Level-Konfiguration erfolgreich von @${adminUsername} gespeichert`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}* wurde von @${adminUsername} auf die Standardeinstellungen zurückgesetzt.`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: 'Aktion bestätigen',
		description: 'Bist du sicher, dass du diese Aktion ausführen möchtest?',
		confirmLabel: 'Bestätigen',
	},
	LevelResetToDefault: {
		title: 'Auf Standard zurücksetzen',
		description:
			'Bist du sicher, dass du die Aktion, das Timeout und die Nachricht dieses Levels auf die Standardwerte zurücksetzen möchtest? Dies kann nicht rückgängig gemacht werden.',
		confirmLabel: 'Zurücksetzen',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} hat den Zeitplan für Berichte zu markierten Benutzern für diesen Kanal eingerichtet.`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} hat den Zeitplan für Berichte zu markierten Benutzern für diesen Kanal entfernt. Es werden keine weiteren automatischen Berichte gesendet.`,
};

export const dailyReportNotification = {
	title: (dateStr: string) => `**Täglicher Anti-Spam-Bericht** — ${dateStr}`,

	allClear: {
		heading: '**Alles klar** — keine Spam-Aktivität in diesem Zeitraum.',
		flagsLine: '• Markierungen: 0',
		flaggedUsersLine: '• Markierte Benutzer: 0',
		trackedUsersLine: (count: number) => `• Erfasste Benutzer: ${count}`,
	},

	summary: {
		heading: '**Zusammenfassung:**',
		flagsLine: (count: number) =>
			`• Markierungen in diesem Zeitraum: ${count}`,
		flaggedUsersLine: (count: number) =>
			`• Aktuell markierte Benutzer: ${count}`,
		adminActionsLine: (count: number) =>
			`• Admin-Aktionen in diesem Zeitraum: ${count}`,
		trackedUsersLine: (count: number) =>
			`• Insgesamt erfasste Benutzer: ${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}** (${count}):`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — ${totalFlags} Markierungen insgesamt`,
	},

	flaggedUsers: {
		heading: '**Markierte Benutzer (in diesem Zeitraum):**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} Markierungen (${triggerList}) — aktuell: ${currentLabel}`,
		rooms: (roomsList: string) => `      _Räume: ${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _Räume: ${roomsList} (+mehr, zeige die ersten ${MAX_ROOMS_PER_SUMMARY})_`,
	},

	adminActions: {
		heading: '**Admin-Aktionen (in diesem Zeitraum):**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label} von @${adminUsername}`,
	},

	moreCount: (n: number) => `  _...und ${n} weitere_`,
};

export const scheduleSetupModalText = {
	everyDay: 'Jeden Tag',
	days: {
		sun: 'So',
		mon: 'Mo',
		tue: 'Di',
		wed: 'Mi',
		thu: 'Do',
		fri: 'Fr',
		sat: 'Sa',
	},
	cadenceLabels: {
		daily: 'Täglich',
		weekdays: 'Wochentage',
		weekly: 'Wöchentlich',
		custom: 'Benutzerdefiniert',
	},
	setup: {
		headerDefault:
			'Lege fest, wann der Bericht zu markierten Benutzern an diesen Kanal gesendet wird.',
		headerExisting: (desc: string) =>
			`*Aktueller Zeitplan:* ${desc}\n\nRichte unten einen Ersatz ein — dieser überschreibt den bestehenden Zeitplan nach der Bestätigung.`,
		deleteButton: 'Aktuellen Zeitplan löschen',
		cadenceLabel: 'Häufigkeit',
		cadencePlaceholder: 'Häufigkeit auswählen',
		cadenceHint:
			'*Täglich:* jeden Tag  ·  *Wochentage:* Mo–Fr  ·  *Wöchentlich:* jeden Montag\n*Benutzerdefiniert:* wähle die genauen Tage unten aus (nur verwendet, wenn Häufigkeit = Benutzerdefiniert).',
		daysLabel: 'Tage (nur bei Häufigkeit „Benutzerdefiniert“)',
		daysPlaceholder: 'Tage auswählen',
		timeLabel: 'Uhrzeit',
		title: 'Bericht planen',
		previewButton: 'Vorschau',
	},
	confirm: {
		title: 'Zeitplan bestätigen',
		backButton: '← Zurück',
		confirmButton: 'Bestätigen & Planen',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*Häufigkeit:* ${cadence}\n` +
			`*Tage:* ${days}\n` +
			`*Uhrzeit:* ${time} (${offset})\n\n` +
			`*Nächste Ausführung:* ${nextRun}` +
			(hadExisting ? `\n\n_Dies ersetzt den bestehenden Zeitplan._` : ''),
	},
	delete: {
		title: 'Zeitplan löschen',
		confirmButton: 'Zeitplan löschen',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*Bestehender Zeitplan:*\n` +
			`*Häufigkeit:* ${cadence}\n` +
			`*Tage:* ${days}\n` +
			`*Uhrzeit:* ${time} (${offset})\n\n` +
			`*Dadurch wird der laufende Zeitplan-Job gestoppt und entfernt. Es werden keine weiteren automatischen Berichte gesendet, bis ein neuer Zeitplan eingerichtet wird.*`,
	},
};

export const scheduleValidationText = {
	invalidTime: 'Gib eine gültige Uhrzeit im Format HH:MM ein, z. B. 09:00',
	missingCustomDays:
		'Wähle mindestens einen Tag für die Häufigkeit „Benutzerdefiniert“ aus.',
};
export const whitelistModalText = {
	whitelistModalTitle: 'Spam Monitor Whitelist',
	whitelistModalSubTitle:
		'Kanäle und Rollen, die hier aufgeführt sind, sind vollständig von der Spam-Überwachung ausgenommen — keine Erkennung, keine Einschränkungen. Bearbeite eine der Listen und klicke auf Speichern; alles, was aus einer Liste entfernt wird, verliert den Whitelist-Status.',
	channelListLabel: 'Kanäle in der Whitelist (durch Komma getrennt)',
	roleListLabel: 'Rollen in der Whitelist (durch Komma getrennt)',
	channelListInputPlaceholder: 'allgemein, zufaellig, support',
	roleListInputPlaceholder: 'moderator, admin, support-team',
	channelListInputHint:
		'*Kanalnamen unterscheiden zwischen Groß- und Kleinschreibung — gib sie genau so ein, wie sie in Rocket.Chat erscheinen (z. B. "allgemein", nicht "Allgemein").' +
		'\n' +
		'Wenn du dir bei der Schreibweise eines Kanalnamens nicht sicher bist, überprüfe die Kanalliste in Rocket.Chat.',
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
				`${addedChannels.map((c) => `#${c}`).join(', ')} zur Whitelist hinzugefügt.`,
			);
		}
		if (removedChannels.length > 0) {
			parts.push(
				`${removedChannels.map((c) => `#${c}`).join(', ')} aus der Whitelist entfernt.`,
			);
		}
		if (addedRoles.length > 0) {
			parts.push(
				`Rolle(n) ${addedRoles.map((r) => `\`${r}\``).join(', ')} zur Whitelist hinzugefügt.`,
			);
		}
		if (removedRoles.length > 0) {
			parts.push(
				`Rolle(n) ${removedRoles.map((r) => `\`${r}\``).join(', ')} aus der Whitelist entfernt.`,
			);
		}
		if (notFoundChannels.length > 0) {
			parts.push(
				`Nicht gefunden: ${notFoundChannels.map((c) => `#${c}`).join(', ')}. Überprüfe die Kanalnamen auf Großbuchstaben.`,
			);
		}
		if (parts.length === 0) {
			return 'Spam-Monitor-Whitelist gespeichert — keine Änderungen.';
		}
		return `Spam-Monitor-Whitelist aktualisiert. ${parts.join(' ')}`;
	},
};
export const configModalText = {
	title: 'SpamMonitor-Konfiguration',
	header: 'Wähle unten einen Bereich zum Konfigurieren aus.',
	configureButton: 'Konfigurieren',
};
export const slashNotifications = {
	NO_FLAGGED_USERS: 'Derzeit keine markierten Benutzer.',
	NO_PERMISSION: 'Du hast keine Berechtigung, diesen Befehl zu verwenden.',
	ADMIN_CHANNEL_ONLY:
		'Dieser Befehl kann nur im Admin-Kanal verwendet werden.',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`Keine markierten Benutzer für den Filter gefunden: *${filter}*.`,
	USER_NOT_FOUND: (username: string) =>
		`Benutzer *@${username}* nicht gefunden oder hat keinen Spam-Eintrag.`,
	MANAGE_MISSING_USERNAME: 'Verwendung: `/spammonitor manage <username>`',
	LEVEL_MISSING_LEVEL: 'Verwendung: `/spammonitor level`',
	SCHEDULE_MISSING_TRIGGER: 'Verwendung: `/spammonitor schedule`',
	CONFIG_MISSING_TRIGGER: 'Verwendung: `/spammonitor config`',
};

export const slashCommandHelp = {
	HELP:
		'*SpamMonitor-Befehle*\n' +
		'`/spammonitor list all` — alle markierten Benutzer, höchster Level zuerst\n' +
		'`/spammonitor list timeout` — Benutzer mit aktuell aktiver Abklingzeit\n' +
		'`/spammonitor list <Level>` — Benutzer auf einem bestimmten Level, z. B. `list review` für Benutzer in Admin-Überprüfung\n' +
		'`/spammonitor manage <username>` — Admin-Steuerung für einen markierten Benutzer öffnen\n' +
		'`/spammonitor level` — Aktion und Benachrichtigung pro Spam-Level konfigurieren\n' +
		'`/spammonitor schedule` — täglichen Anti-Spam-Bericht konfigurieren\n' +
		'`/spammonitor config` — die Whitelist für Kanäle und Rollen konfigurieren, die von der Spam-Überwachung ausgenommen sind',
};

export const languageModalText = {
	title: 'Spracheinstellungen',
	header: 'Wähle deine bevorzugte Sprache für Bot-Nachrichten, Modale und Benachrichtigungen aus.',
	selectLabel: 'Sprache',
	selectPlaceholder: 'Sprache auswählen',
};

export const commonModalText = {
	cancel: 'Abbrechen',
	submit: 'Absenden',
	edit: 'Bearbeiten',
	close: 'Schließen',
	save: 'Speichern',
};
export const languageNotification = {
	LanguageChanged: (languageLabel: string) =>
		`Deine Sprachpräferenz wurde auf *${languageLabel}* geändert.`,
};

export const EditLevelModalStrings = {
	modalTitle: (levelLabelText: string) => `Bearbeiten — ${levelLabelText}`,
	headerTitle: (levelLabelText: string) => `*Bearbeite: ${levelLabelText}*`,
	backToOverviewButton: '← Zurück zur Übersicht',
	resetToDefaultButton: 'Auf Standard zurücksetzen',
	actionSelectLabel: 'Aktion',
	actionSelectPlaceholder: 'Aktion auswählen',
	timeoutPlaceholder: (defaultTimeout: number) => `z. B. ${defaultTimeout}`,
};
export const LevelOverviewModalStrings = {
	modalTitle: 'Level-Konfiguration',
	actionSummaryPrefix: (levelLabelText: string, actionSummary: string) =>
		`*${levelLabelText}*\nAktion: ${actionSummary}`,
	messagePreviewPrefix: (messagePreview: string) =>
		`Nachricht: ${messagePreview}`,
	noCustomMessage:
		'_Keine benutzerdefinierte Nachricht (Standard wird verwendet)_',
	messagePreviewTruncated: (preview: string) => `_"${preview}…"_`,
	messagePreviewFull: (preview: string) => `_"${preview}"_`,
};
export const ManageUserModalStrings = {
	modalTitle: (username: string) => `@${username} verwalten`,
	userLabel: (username: string) => `*Benutzer:* @${username}`,
	spamLevelFieldLabel: (levelLabelText: string) =>
		`*Spam-Level:*\n${levelLabelText}`,
	cooldownFieldLabel: (cooldownText: string) =>
		`*Abklingzeit:*\n${cooldownText}`,
	lastEscalationFieldLabel: (dateText: string) =>
		`*Letzte Eskalation:*\n${dateText}`,
	actionsHeader: '*Admin-Aktionen*',
	vouchButtonFallback: 'Bürgen',
	resetCooldownButtonFallback: 'Abklingzeit zurücksetzen',
	levelDownButtonFallback: 'Level herabstufen',
	resetToCleanButtonFallback: 'Auf Clean zurücksetzen',
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
		`Insgesamt markiert: *${total}* | ` +
		`Überwacht: *${monitored}* | ` +
		`Eingeschränkt: *${restricted}* | ` +
		`Gesperrt: *${suspended}* | ` +
		`Überprüfung ausstehend: *${adminReview}* | ` +
		`In Abklingzeit: *${timedOut}*`,
	userRowLine: (username: string, label: string, cooldownStr: string) =>
		`@${username} — *${label}*${cooldownStr}`,
	cooldownSuffix: (formattedDate: string) =>
		` | Abklingzeit bis ${formattedDate} UTC`,
	manageUserOverflowOption: 'Benutzer verwalten',
	listHeader: (summary: string, title: string) => `${summary}\n\n*${title}*`,
	listTitleSuffix: (title: string) => `${title}-Benutzer`,
	allFlaggedUsersTitle: 'Alle markierten Benutzer',
	pendingAdminReviewTitle: 'Ausstehende Admin-Überprüfung',
	unknownLevelError: (levelName: string, validLevels: string) =>
		`Unbekannter Level *${levelName}*. Gültige Level: ${validLevels}.\n` +
		`Verwende für Benutzer in Admin-Überprüfung \`list review\`.`,
	activeTimeoutTitle: 'Benutzer mit aktiver Abklingzeit',
	activeTimeoutFilterKey: 'aktive Abklingzeit',
};
export const configEntriesText = {
	whitelist: {
		label: 'Whitelist',
		description:
			'Kanäle und Rollen, die vollständig von der Spam-Überwachung ausgeschlossen sind.',
	},
	language: {
		label: 'Sprache',
		description: 'Wählen Sie die Sprache für Bot-Nachrichten und Modale.',
	},
};
