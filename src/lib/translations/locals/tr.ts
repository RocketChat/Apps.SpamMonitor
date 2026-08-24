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
		`Merhaba @${username}, hesabında olağan dışı bir etkinlik fark ettik.\n\nMesajların şu anda izleniyor. Lütfen yavaşla ve birden fazla kanalda tekrarlanan veya aynı mesajları göndermekten kaçın.\n\nBu durum devam ederse ek kısıtlamalar uygulanabilir.`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}, hesabın ${duration} süreyle bekleme süresine alındı.\n\nBu süre boyunca mesaj gönderemeyeceksin. Bu, tekrar tekrar işaretlenen davranış nedeniyle tetiklendi.\n\nBekleme süresi dolduğunda kısıtlama otomatik olarak kaldırılacaktır.`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}, hesabın ${duration} süreyle mesaj göndermekten men edildi.\n\nBu, önceki uyarılardan sonra devam eden spam benzeri davranıştan kaynaklanmaktadır. Askıya alma süresi bitene kadar mesajların engellenecek.\n\nBunun bir hata olduğunu düşünüyorsan lütfen bir yöneticiyle iletişime geç.`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}, hesabın yönetici incelemesi için işaretlendi.\n\nBir yönetici hesabını inceleyip kısıtlamayı kaldırana kadar mesaj gönderemeyeceksin.\n\nAcil yardıma ihtiyacın varsa lütfen doğrudan bir yöneticiyle iletişime geç.`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**SpamMonitor Yönetici Paneli**\n\n` +
		`Bu, SpamMonitor uygulaması için ayrılmış yönetici kanalıdır. ` +
		`Tüm eğik çizgi komutları yalnızca bu kanaldan çalıştırılmalıdır.\n\n` +
		`---\n\n` +
		`**Spam Seviyeleri ve Varsayılan Eylemler** \n` +
		`• \`Clean\` — Herhangi bir sorun tespit edilmedi\n` +
		`• \`Monitored\` — Olağan dışı etkinlik işaretlendi; kullanıcı izleniyor\n` +
		`• \`Restricted\` — Kullanıcı süreli bir bekleme süresine alındı\n` +
		`• \`Suspended\` — Kullanıcı daha uzun bir süre için askıya alındı\n` +
		`• \`AdminReview\` — Tamamen engellendi; manuel yönetici işlemi bekliyor\n\n` +
		`---\n\n` +
		`**Kullanılabilir Komutlar** (\`/spammonitor <alt komut>\`)\n` +
		`• \`list\` — Şu anda işaretlenmiş tüm kullanıcıları görüntüle\n` +
		`• \`manage <username>\` — İşaretlenmiş bir kullanıcı için yönetici kontrollerini aç\n` +
		`• \`level\` — Her spam seviyesi için eylem ve bildirimi yapılandır\n\n` +
		`• \`schedule\` — Zamanlanmış spam raporları için programı yapılandır\n\n` +
		`• \`config\` — Kanal ve rol beyaz listesi gibi spam monitor ayarlarını yapılandır\n\n` +
		`• \`help\` — Bu yardım mesajını göster\n\n` +
		`---\n\n` +
		`**Ayarları Yapılandır**\n` +
		`_Eşik değerlerini ve zaman aralıklarını Marketplace → Private Apps → Apps.SpamMonitor üzerinden yapılandır._`,

	installDm: (channelName: string) =>
		`**SpamMonitor yüklendi!**\n\n` +
		`Bir yönetici paneli kanalı \`#${channelName}\` oluşturuldu.\n` +
		`Tüm eğik çizgi komutları yalnızca bu kanalla sınırlıdır.\n` +
		`Ayarları *Marketplace → Private Apps → Apps.SpamMonitor* üzerinden yapılandır.`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor kaldırıldı.**\n\n` +
		`\`#${channelName}\` kanalı kaldırıldı.`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername}, @${adminUsername} tarafından başarıyla kefil olundu — artık spam izlemeden tamamen muaf.`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} için bekleme süresi @${adminUsername} tarafından başarıyla sıfırlandı.`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`@${targetUsername} için spam seviyesi @${adminUsername} tarafından *${beforeLabel}* → *${afterLabel}* olarak başarıyla düşürüldü.`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername}, @${adminUsername} tarafından başarıyla *Clean* durumuna sıfırlandı.`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: 'Kullanıcıya Kefil Ol',
		description:
			'Bu işlem kullanıcıyı *güvenilir* olarak işaretleyecek ve spam izlemeden tamamen muaf tutacaktır.',
		confirmLabel: 'Kefaleti Onayla',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: 'Bekleme Süresini Sıfırla',
		description:
			'Bu işlem, bu kullanıcı için aktif bekleme süresini/zaman aşımını hemen kaldıracaktır.',
		confirmLabel: 'Bekleme Süresini Sıfırla',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: 'Seviyeyi Düşür',
		description: 'Bu işlem spam seviyesini bir kademe düşürecektir.',
		confirmLabel: 'Seviyeyi Düşür',
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: 'Clean Durumuna Sıfırla',
		description:
			'Bu işlem spam seviyesini hemen *Clean* durumuna sıfırlayarak tüm kısıtlamaları kaldıracaktır.',
		confirmLabel: 'Clean Durumuna Sıfırla',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*Seviye davranışını yapılandır* — bir seviye seç, bir kullanıcı ' +
		'bu seviyeye ulaştığında botun ne yapacağını belirle ve isteğe bağlı olarak ' +
		'kullanıcıya gönderilen mesajı özelleştir. Varsayılan mesajı kullanmak için boş bırak.',
	levelOverviewModalHeader:
		'*Spam Seviyesi Yapılandırması*\n' +
		'Her seviyenin davranışını aşağıda incele. ' +
		"Bir seviyenin eylemini, zaman aşımını veya bildirim mesajını değiştirmek için *Düzenle*'ye tıkla.",
	timeoutLabel:
		'Zaman aşımı süresi (saniye) — yalnızca eylem "Timeout" olduğunda kullanılır',
	customNotificationLabel:
		'Özel bildirim mesajı; yer tutucu olarak {user} ve {duration} kullan - (varsayılan için boş bırak)',
	customNotificationHint: `Yer tutucuda gösterilen varsayılan mesajı kullanmak için boş bırak.`,
	defaultNotificationInputPlaceholder:
		'Bu seviye tetiklendiğinde kullanıcıya gönderilen mesaj...',
};

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`*${levelLabel(level)}* için herhangi bir değişiklik tespit edilmedi.`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`Seviye yapılandırması @${adminUsername}* tarafından güncellendi*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`Seviye yapılandırması @${adminUsername} tarafından başarıyla kaydedildi`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}*, @${adminUsername} tarafından varsayılan ayarlarına sıfırlandı.`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: 'Eylemi Onayla',
		description: 'Bu eylemi gerçekleştirmek istediğinden emin misin?',
		confirmLabel: 'Onayla',
	},
	LevelResetToDefault: {
		title: 'Varsayılanlara Sıfırla',
		description:
			'Bu seviyenin eylemini, zaman aşımını ve mesajını varsayılan değerlere sıfırlamak istediğinden emin misin? Bu işlem geri alınamaz.',
		confirmLabel: 'Sıfırla',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} bu kanal için işaretlenmiş kullanıcı raporu programını ayarladı.`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} bu kanal için işaretlenmiş kullanıcı raporu programını kaldırdı. Artık otomatik rapor gönderilmeyecek.`,
};

export const dailyReportNotification = {
	title: (dateStr: string) => `**Günlük Anti-Spam Raporu** — ${dateStr}`,

	allClear: {
		heading: '**Her Şey Temiz** — bu dönemde spam etkinliği görülmedi.',
		flagsLine: '• İşaretlemeler: 0',
		flaggedUsersLine: '• İşaretlenen kullanıcılar: 0',
		trackedUsersLine: (count: number) => `• İzlenen kullanıcılar: ${count}`,
	},

	summary: {
		heading: '**Özet:**',
		flagsLine: (count: number) => `• Bu dönemdeki işaretlemeler: ${count}`,
		flaggedUsersLine: (count: number) =>
			`• Şu anda işaretli kullanıcılar: ${count}`,
		adminActionsLine: (count: number) =>
			`• Bu dönemdeki yönetici işlemleri: ${count}`,
		trackedUsersLine: (count: number) =>
			`• Toplam izlenen kullanıcılar: ${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}** (${count}):`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — toplam ${totalFlags} işaretleme`,
	},

	flaggedUsers: {
		heading: '**İşaretlenen Kullanıcılar (bu dönemde):**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} işaretleme (${triggerList}) — şu anki durum: ${currentLabel}`,
		rooms: (roomsList: string) => `      _Odalar: ${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _Odalar: ${roomsList} (+daha fazla, ilk ${MAX_ROOMS_PER_SUMMARY} gösteriliyor)_`,
	},

	adminActions: {
		heading: '**Yönetici İşlemleri (bu dönemde):**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label}, @${adminUsername} tarafından`,
	},

	moreCount: (n: number) => `  _...ve ${n} tane daha_`,
};

export const scheduleSetupModalText = {
	everyDay: 'Her gün',
	days: {
		sun: 'Paz',
		mon: 'Pzt',
		tue: 'Sal',
		wed: 'Çar',
		thu: 'Per',
		fri: 'Cum',
		sat: 'Cmt',
	},
	cadenceLabels: {
		daily: 'Günlük',
		weekdays: 'Hafta içi',
		weekly: 'Haftalık',
		custom: 'Özel',
	},
	setup: {
		headerDefault:
			'İşaretlenmiş kullanıcı raporunun bu kanala ne zaman gönderileceğini yapılandır.',
		headerExisting: (desc: string) =>
			`*Mevcut program:* ${desc}\n\nAşağıda bir değişiklik yap — bu, onaylandığında mevcut programın üzerine yazılır.`,
		deleteButton: 'Mevcut programı sil',
		cadenceLabel: 'Sıklık',
		cadencePlaceholder: 'Sıklığı seç',
		cadenceHint:
			'*Günlük:* her gün  ·  *Hafta içi:* Pzt–Cum  ·  *Haftalık:* her Pazartesi\n*Özel:* aşağıdan tam olarak istediğin günleri seç (yalnızca Sıklık = Özel olduğunda kullanılır).',
		daysLabel: 'Günler (yalnızca Özel sıklık için)',
		daysPlaceholder: 'Günleri seç',
		timeLabel: 'Saat',
		title: 'Rapor Zamanla',
		previewButton: 'Önizleme',
	},
	confirm: {
		title: 'Programı Onayla',
		backButton: '← Geri',
		confirmButton: 'Onayla ve Zamanla',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*Sıklık:* ${cadence}\n` +
			`*Günler:* ${days}\n` +
			`*Saat:* ${time} (${offset})\n\n` +
			`*Sonraki çalışma:* ${nextRun}` +
			(hadExisting ? `\n\n_Bu, mevcut programın yerini alacaktır._` : ''),
	},
	delete: {
		title: 'Programı Sil',
		confirmButton: 'Programı Sil',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*Mevcut program:*\n` +
			`*Sıklık:* ${cadence}\n` +
			`*Günler:* ${days}\n` +
			`*Saat:* ${time} (${offset})\n\n` +
			`*Bu işlem, çalışmakta olan zamanlanmış görevi durdurup kaldıracaktır. Yeni bir program ayarlanana kadar başka otomatik rapor gönderilmeyecektir.*`,
	},
};

export const scheduleValidationText = {
	invalidTime: 'SS:DD biçiminde geçerli bir saat gir, örn. 09:00',
	missingCustomDays: 'Özel sıklık için en az bir gün seç.',
};
export const whitelistModalText = {
	whitelistModalTitle: 'Spam Monitor Beyaz Listesi',
	whitelistModalSubTitle:
		"Burada listelenen kanallar ve roller spam izlemeden tamamen hariç tutulur — algılama yok, kısıtlama yok. Listelerden herhangi birini düzenleyip Kaydet'e bas; bir listeden kaldırılan her şey beyaz listeden çıkarılır.",
	channelListLabel: 'Beyaz listedeki kanallar (virgülle ayrılmış)',
	roleListLabel: 'Beyaz listedeki roller (virgülle ayrılmış)',
	channelListInputPlaceholder: 'genel, rastgele, destek',
	roleListInputPlaceholder: 'moderator, admin, destek-ekibi',
	channelListInputHint:
		'*Kanal adları büyük/küçük harfe duyarlıdır — bunları Rocket.Chat\'te göründükleri şekilde tam olarak gir (örn. "genel", "Genel" değil).' +
		'\n' +
		"Bir kanal adının büyük/küçük harf durumundan emin değilsen Rocket.Chat'teki kanal listesini kontrol et.",
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
				`${addedChannels.map((c) => `#${c}`).join(', ')} beyaz listeye eklendi.`,
			);
		}
		if (removedChannels.length > 0) {
			parts.push(
				`${removedChannels.map((c) => `#${c}`).join(', ')} beyaz listeden kaldırıldı.`,
			);
		}
		if (addedRoles.length > 0) {
			parts.push(
				`${addedRoles.map((r) => `\`${r}\``).join(', ')} rolü/rolleri beyaz listeye eklendi.`,
			);
		}
		if (removedRoles.length > 0) {
			parts.push(
				`${removedRoles.map((r) => `\`${r}\``).join(', ')} rolü/rolleri beyaz listeden kaldırıldı.`,
			);
		}
		if (notFoundChannels.length > 0) {
			parts.push(
				`Bulunamadı: ${notFoundChannels.map((c) => `#${c}`).join(', ')}. Kanal adlarında büyük harf olup olmadığını kontrol et.`,
			);
		}
		if (parts.length === 0) {
			return 'Spam monitor beyaz listesi kaydedildi — değişiklik yok.';
		}
		return `Spam monitor beyaz listesi güncellendi. ${parts.join(' ')}`;
	},
};
export const configModalText = {
	title: 'SpamMonitor Yapılandırması',
	header: 'Yapılandırmak için aşağıdan bir bölüm seç.',
	configureButton: 'Yapılandır',
};
export const slashNotifications = {
	NO_FLAGGED_USERS: 'Şu anda işaretlenmiş kullanıcı yok.',
	NO_PERMISSION: 'Bu komutu kullanma yetkin yok.',
	ADMIN_CHANNEL_ONLY: 'Bu komut yalnızca yönetici kanalında kullanılabilir.',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`*${filter}* filtresi için işaretlenmiş kullanıcı bulunamadı.`,
	USER_NOT_FOUND: (username: string) =>
		`*@${username}* kullanıcısı bulunamadı veya spam kaydı yok.`,
	MANAGE_MISSING_USERNAME: 'Kullanım: `/spammonitor manage <username>`',
	LEVEL_MISSING_LEVEL: 'Kullanım: `/spammonitor level`',
	SCHEDULE_MISSING_TRIGGER: 'Kullanım: `/spammonitor schedule`',
	CONFIG_MISSING_TRIGGER: 'Kullanım: `/spammonitor config`',
};

export const slashCommandHelp = {
	HELP:
		'*SpamMonitor Komutları*\n' +
		'`/spammonitor list all` — en yüksek seviyeden başlayarak tüm işaretlenmiş kullanıcılar\n' +
		'`/spammonitor list timeout` — şu anda aktif bekleme süresinde olan kullanıcılar\n' +
		'`/spammonitor list <Level>` — belirli bir seviyedeki kullanıcılar, örn. yönetici incelemesindeki kullanıcılar için `list review`\n' +
		'`/spammonitor manage <username>` — işaretlenmiş bir kullanıcı için yönetici kontrollerini aç\n' +
		'`/spammonitor level` — her spam seviyesi için eylem ve bildirimi yapılandır\n' +
		'`/spammonitor schedule` — günlük anti-spam raporunu yapılandır\n' +
		'`/spammonitor config` — spam izlemeden muaf tutulacak kanal ve rol beyaz listesini yapılandır',
};

export const languageModalText = {
	title: 'Dil Ayarları',
	header: 'Bot mesajları, modallar ve bildirimler için tercih ettiğin dili seç.',
	selectLabel: 'Dil',
	selectPlaceholder: 'Bir dil seç',
};

export const commonModalText = {
	cancel: 'İptal',
	submit: 'Gönder',
	edit: 'Düzenle',
	close: 'Kapat',
	save: 'Kaydet',
};
export const languageNotification = {
	LanguageChanged: (languageLabel: string) =>
		`Dil tercihin *${languageLabel}* olarak değiştirildi.`,
};

export const EditLevelModalStrings = {
	modalTitle: (levelLabelText: string) => `Düzenle — ${levelLabelText}`,
	headerTitle: (levelLabelText: string) =>
		`*Düzenleniyor: ${levelLabelText}*`,
	backToOverviewButton: '← Genel Bakışa Dön',
	resetToDefaultButton: 'Varsayılanlara Sıfırla',
	actionSelectLabel: 'Eylem',
	actionSelectPlaceholder: 'Bir eylem seç',
	timeoutPlaceholder: (defaultTimeout: number) => `örn. ${defaultTimeout}`,
};
export const LevelOverviewModalStrings = {
	modalTitle: 'Seviye Yapılandırması',
	actionSummaryPrefix: (levelLabelText: string, actionSummary: string) =>
		`*${levelLabelText}*\nEylem: ${actionSummary}`,
	messagePreviewPrefix: (messagePreview: string) =>
		`Mesaj: ${messagePreview}`,
	noCustomMessage: '_Özel mesaj yok (varsayılan kullanılıyor)_',
	messagePreviewTruncated: (preview: string) => `_"${preview}…"_`,
	messagePreviewFull: (preview: string) => `_"${preview}"_`,
};
export const ManageUserModalStrings = {
	modalTitle: (username: string) => `@${username} Yönet`,
	userLabel: (username: string) => `*Kullanıcı:* @${username}`,
	spamLevelFieldLabel: (levelLabelText: string) =>
		`*Spam Seviyesi:*\n${levelLabelText}`,
	cooldownFieldLabel: (cooldownText: string) =>
		`*Bekleme Süresi:*\n${cooldownText}`,
	lastEscalationFieldLabel: (dateText: string) =>
		`*Son Yükseltme:*\n${dateText}`,
	actionsHeader: '*Yönetici İşlemleri*',
	vouchButtonFallback: 'Kefil Ol',
	resetCooldownButtonFallback: 'Bekleme Süresini Sıfırla',
	levelDownButtonFallback: 'Seviyeyi Düşür',
	resetToCleanButtonFallback: 'Clean Durumuna Sıfırla',
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
		`Toplam işaretlenen: *${total}* | ` +
		`İzlenen: *${monitored}* | ` +
		`Kısıtlanan: *${restricted}* | ` +
		`Askıya alınan: *${suspended}* | ` +
		`İnceleme bekleyen: *${adminReview}* | ` +
		`Bekleme süresinde: *${timedOut}*`,
	userRowLine: (username: string, label: string, cooldownStr: string) =>
		`@${username} — *${label}*${cooldownStr}`,
	cooldownSuffix: (formattedDate: string) =>
		` | ${formattedDate} UTC'ye kadar bekleme süresinde`,
	manageUserOverflowOption: 'Kullanıcıyı yönet',
	listHeader: (summary: string, title: string) => `${summary}\n\n*${title}*`,
	listTitleSuffix: (title: string) => `${title} Kullanıcılar`,
	allFlaggedUsersTitle: 'Tüm İşaretlenmiş Kullanıcılar',
	pendingAdminReviewTitle: 'Yönetici İncelemesi Bekleyen',
	unknownLevelError: (levelName: string, validLevels: string) =>
		`Bilinmeyen seviye *${levelName}*. Geçerli seviyeler: ${validLevels}.\n` +
		`Yönetici incelemesindeki kullanıcılar için \`list review\` kullan.`,
	activeTimeoutTitle: 'Aktif Bekleme Süresindeki Kullanıcılar',
	activeTimeoutFilterKey: 'aktif bekleme süresi',
};
export const configEntriesText = {
	whitelist: {
		label: 'Beyaz Liste',
		description: 'Spam izlemeden tamamen muaf tutulan kanallar ve roller.',
	},
	language: {
		label: 'Dil',
		description: 'Bot mesajları ve modalları için kullanılan dili seçin.',
	},
};
