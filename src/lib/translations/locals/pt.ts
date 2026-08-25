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
		`Olá @${username}, detectamos alguma atividade incomum na sua conta.\n\nSuas mensagens estão sendo monitoradas. Por favor, diminua o ritmo e evite enviar mensagens repetidas ou idênticas em vários canais.\n\nSe isso continuar, restrições adicionais poderão ser aplicadas.`,
	[SpammingLevel.Restricted]: (username, duration) =>
		`@${username}, sua conta foi colocada em um período de espera de ${duration}.\n\nVocê não poderá enviar mensagens durante esse período. Isso foi acionado por comportamento sinalizado repetidamente.\n\nA restrição será removida automaticamente quando o período de espera expirar.`,
	[SpammingLevel.Suspended]: (username, duration) =>
		`@${username}, sua conta foi suspensa de enviar mensagens por ${duration}.\n\nIsso se deve a comportamento contínuo semelhante a spam após avisos anteriores. Suas mensagens serão bloqueadas até o fim do período de suspensão.\n\nSe você acredita que isso é um engano, entre em contato com um administrador.`,
	[SpammingLevel.AdminReview]: (username) =>
		`@${username}, sua conta foi sinalizada para revisão administrativa.\n\nVocê está atualmente impedido de enviar mensagens até que um administrador revise sua conta e remova a restrição.\n\nEntre em contato diretamente com um administrador se precisar de assistência imediata.`,
};

export const AdminChannelMessages = {
	welcome: () =>
		`**Painel de Administração do SpamMonitor**\n\n` +
		`Este é o canal de administração dedicado ao aplicativo SpamMonitor. ` +
		`Todos os comandos de barra devem ser executados a partir deste canal.\n\n` +
		`---\n\n` +
		`**Níveis de Spam e Ações Padrão** \n` +
		`• \`Clean\` — Nenhum problema detectado\n` +
		`• \`Monitored\` — Atividade incomum sinalizada; o usuário está sendo observado\n` +
		`• \`Restricted\` — Usuário colocado em um período de espera cronometrado\n` +
		`• \`Suspended\` — Usuário suspenso por um período mais longo\n` +
		`• \`AdminReview\` — Totalmente bloqueado; aguardando ação manual do administrador\n\n` +
		`---\n\n` +
		`**Comandos Disponíveis** (\`/spammonitor <subcomando>\`)\n` +
		`• \`list\` — Ver todos os usuários atualmente sinalizados\n` +
		`• \`manage <username>\` — Abrir controles administrativos para um usuário sinalizado\n` +
		`• \`level\` — Configurar ação e notificação por nível de spam\n\n` +
		`• \`schedule\` — Configurar agendamento para relatórios de spam agendados\n\n` +
		`• \`config\` — Configurar as definições do spam monitor, como canais e cargos na lista de permissões\n\n` +
		`• \`help\` — Mostrar esta mensagem de ajuda\n\n` +
		`---\n\n` +
		`**Configurar Definições**\n` +
		`_Configure limites e janelas em Marketplace → Aplicativos Privados → Apps.SpamMonitor._`,

	installDm: (channelName: string) =>
		`**SpamMonitor instalado!**\n\n` +
		`Um canal de painel de administração \`#${channelName}\` foi criado.\n` +
		`Todos os comandos de barra ficam restritos a esse canal.\n` +
		`Configure as definições em *Marketplace → Aplicativos Privados → Apps.SpamMonitor*.`,

	uninstallDm: (channelName: string) =>
		`**SpamMonitor desinstalado.**\n\n` +
		`O canal \`#${channelName}\` foi removido.`,
};
export const AdminActionMessages = {
	vouch: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} foi avalizado com sucesso por @${adminUsername} — agora totalmente isento do monitoramento de spam.`,
	resetCooldown: (targetUsername: string, adminUsername: string) =>
		`Período de espera de @${targetUsername} redefinido com sucesso por @${adminUsername}.`,
	resetLevelDown: (
		targetUsername: string,
		adminUsername: string,
		beforeLabel: string,
		afterLabel: string,
	) =>
		`Nível de spam de @${targetUsername} reduzido de *${beforeLabel}* → *${afterLabel}* com sucesso por @${adminUsername}.`,
	resetLevelClean: (targetUsername: string, adminUsername: string) =>
		`@${targetUsername} redefinido para *Clean* com sucesso por @${adminUsername}.`,
};

export const ConfirmActionMeta: Partial<
	Record<ManageUserActionId, ConfirmMeta>
> = {
	[ManageUserActionId.VOUCH]: {
		title: 'Avalizar Usuário',
		description:
			'Isso marcará o usuário como *confiável* e o isentará totalmente do monitoramento de spam.',
		confirmLabel: 'Confirmar Aval',
	},
	[ManageUserActionId.RESET_COOLDOWN]: {
		title: 'Redefinir Período de Espera',
		description:
			'Isso removerá imediatamente o período de espera/timeout ativo deste usuário.',
		confirmLabel: 'Redefinir Período de Espera',
	},
	[ManageUserActionId.RESET_LEVEL_DOWN]: {
		title: 'Reduzir Nível',
		description: 'Isso reduzirá o nível de spam em uma etapa.',
		confirmLabel: 'Reduzir Nível',
	},
	[ManageUserActionId.RESET_LEVEL_CLEAN]: {
		title: 'Redefinir para Clean',
		description:
			'Isso redefinirá imediatamente o nível de spam para *Clean*, removendo todas as restrições.',
		confirmLabel: 'Redefinir para Clean',
		danger: true,
	},
};

export const LevelConfigStrings = {
	headerText:
		'*Configurar comportamento do nível* — escolha um nível, defina o ' +
		'que o bot faz quando um usuário atinge esse nível e, opcionalmente, personalize ' +
		'a mensagem enviada a ele. Deixe a mensagem em branco para usar o padrão.',
	levelOverviewModalHeader:
		'*Configuração de Nível de Spam*\n' +
		'Revise o comportamento de cada nível abaixo. ' +
		'Pressione *Editar* para alterar a ação, o timeout ou a mensagem de notificação de um nível.',
	timeoutLabel:
		'Duração do timeout (segundos) — usado apenas quando a ação é "Timeout"',
	customNotificationLabel:
		'Mensagem de notificação personalizada, use {user} e {duration} como marcadores - (deixe em branco para o padrão)',
	customNotificationHint: `Deixe em branco para usar a mensagem padrão mostrada no marcador.`,
	defaultNotificationInputPlaceholder:
		'Mensagem enviada ao usuário quando este nível é acionado...',
};

export const levelConfigNotification = {
	LevelConfigNoChangesFound: (level: SpammingLevel) =>
		`Nenhuma alteração detectada para *${levelLabel(level)}*.`,
	LevelConfigUpdateMessage: (adminUsername: string) =>
		`Configuração de nível atualizada* por @${adminUsername}*`,
	LevelConfigSaveSuccess: (adminUsername: string) =>
		`Configuração de nível salva com sucesso por @${adminUsername}`,
	LevelConfigResetToDefault: (level: SpammingLevel, adminUsername: string) =>
		`*${SPAMMING_LEVEL_LABELS[level]}* foi redefinido para suas configurações padrão por @${adminUsername}.`,
};

export const confirmationModal = {
	ManageUserAction: {
		title: 'Confirmar Ação',
		description: 'Tem certeza de que deseja executar esta ação?',
		confirmLabel: 'Confirmar',
	},
	LevelResetToDefault: {
		title: 'Redefinir para Padrões',
		description:
			'Tem certeza de que deseja redefinir a ação, o timeout e a mensagem deste nível para os padrões? Isso não pode ser desfeito.',
		confirmLabel: 'Redefinir',
	},
};

export const scheduleNotification = {
	ScheduleSet: (adminUsername: string) =>
		`@${adminUsername} configurou o agendamento de relatórios de usuários sinalizados para este canal.`,
	ScheduleRemoved: (adminUsername: string) =>
		`@${adminUsername} removeu o agendamento de relatórios de usuários sinalizados para este canal. Nenhum relatório automático adicional será enviado.`,
};

export const dailyReportNotification = {
	title: (dateStr: string) => `**Relatório Diário Anti-Spam** — ${dateStr}`,

	allClear: {
		heading: '**Tudo Certo** — nenhuma atividade de spam neste período.',
		flagsLine: '• Sinalizações: 0',
		flaggedUsersLine: '• Usuários sinalizados: 0',
		trackedUsersLine: (count: number) => `• Usuários rastreados: ${count}`,
	},

	summary: {
		heading: '**Resumo:**',
		flagsLine: (count: number) => `• Sinalizações neste período: ${count}`,
		flaggedUsersLine: (count: number) =>
			`• Usuários sinalizados atualmente: ${count}`,
		adminActionsLine: (count: number) =>
			`• Ações administrativas neste período: ${count}`,
		trackedUsersLine: (count: number) =>
			`• Total de usuários rastreados: ${count}`,
	},

	levelGroup: {
		heading: (label: string, count: number) => `**${label}** (${count}):`,
		userLine: (username: string, totalFlags: number | string) =>
			`  • @${username} — ${totalFlags} sinalizações no total`,
	},

	flaggedUsers: {
		heading: '**Usuários Sinalizados (neste período):**',
		userLine: (
			username: string,
			flagCount: number,
			triggerList: string,
			currentLabel: string,
		) =>
			`  • @${username} — ${flagCount} sinalizações (${triggerList}) — atualmente: ${currentLabel}`,
		rooms: (roomsList: string) => `      _Salas: ${roomsList}_`,
		roomsTruncated: (roomsList: string) =>
			`      _Salas: ${roomsList} (+mais, mostrando as primeiras ${MAX_ROOMS_PER_SUMMARY})_`,
	},

	adminActions: {
		heading: '**Ações Administrativas (neste período):**',
		actionLine: (username: string, label: string, adminUsername: string) =>
			`  • @${username} — ${label} por @${adminUsername}`,
	},

	moreCount: (n: number) => `  _...e mais ${n}_`,
};

export const scheduleSetupModalText = {
	everyDay: 'Todos os dias',
	days: {
		sun: 'Dom',
		mon: 'Seg',
		tue: 'Ter',
		wed: 'Qua',
		thu: 'Qui',
		fri: 'Sex',
		sat: 'Sáb',
	},
	cadenceLabels: {
		daily: 'Diário',
		weekdays: 'Dias úteis',
		weekly: 'Semanal',
		custom: 'Personalizado',
	},
	setup: {
		headerDefault:
			'Configure quando o relatório de usuários sinalizados será enviado para este canal.',
		headerExisting: (desc: string) =>
			`*Agendamento atual:* ${desc}\n\nConfigure um substituto abaixo — isso sobrescreverá o agendamento existente ao confirmar.`,
		deleteButton: 'Excluir agendamento atual',
		cadenceLabel: 'Frequência',
		cadencePlaceholder: 'Selecione a frequência',
		cadenceHint:
			'*Diário:* todos os dias  ·  *Dias úteis:* Seg–Sex  ·  *Semanal:* toda segunda-feira\n*Personalizado:* escolha os dias exatos abaixo (usado apenas quando Frequência = Personalizado).',
		daysLabel: 'Dias (apenas para frequência Personalizado)',
		daysPlaceholder: 'Selecione os dias',
		timeLabel: 'Horário',
		title: 'Agendar Relatório',
		previewButton: 'Pré-visualizar',
	},
	confirm: {
		title: 'Confirmar Agendamento',
		backButton: '← Voltar',
		confirmButton: 'Confirmar e Agendar',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
			nextRun: string,
			hadExisting: boolean,
		) =>
			`*Frequência:* ${cadence}\n` +
			`*Dias:* ${days}\n` +
			`*Horário:* ${time} (${offset})\n\n` +
			`*Próxima execução:* ${nextRun}` +
			(hadExisting
				? `\n\n_Isso substituirá o agendamento existente._`
				: ''),
	},
	delete: {
		title: 'Excluir Agendamento',
		confirmButton: 'Excluir Agendamento',
		summary: (
			cadence: string,
			days: string,
			time: string,
			offset: string,
		) =>
			`*Agendamento existente:*\n` +
			`*Frequência:* ${cadence}\n` +
			`*Dias:* ${days}\n` +
			`*Horário:* ${time} (${offset})\n\n` +
			`*Isso interromperá e removerá o job de agendamento em execução. Nenhum relatório automático adicional será enviado até que um novo agendamento seja configurado.*`,
	},
};

export const scheduleValidationText = {
	invalidTime: 'Digite um horário válido no formato HH:MM, ex.: 09:00',
	missingCustomDays:
		'Selecione pelo menos um dia para a frequência Personalizado.',
};
export const whitelistModalText = {
	whitelistModalTitle: 'Lista de Permissões do Spam Monitor',
	whitelistModalSubTitle:
		'Canais e cargos listados aqui ficam totalmente excluídos do monitoramento de spam — sem detecção, sem restrições. Edite qualquer uma das listas e clique em Salvar; qualquer item removido de uma lista deixará de estar na lista de permissões.',
	channelListLabel: 'Canais na lista de permissões (separados por vírgula)',
	roleListLabel: 'Cargos na lista de permissões (separados por vírgula)',
	channelListInputPlaceholder: 'geral, aleatorio, suporte',
	roleListInputPlaceholder: 'moderador, admin, equipe-suporte',
	channelListInputHint:
		'*Os nomes dos canais diferenciam maiúsculas de minúsculas — digite-os exatamente como aparecem no Rocket.Chat (ex.: "geral", não "Geral").' +
		'\n' +
		'Se não tiver certeza sobre a grafia de um nome de canal, verifique a lista de canais no Rocket.Chat.',
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
				`Adicionado(s) ${addedChannels.map((c) => `#${c}`).join(', ')} à lista de permissões.`,
			);
		}
		if (removedChannels.length > 0) {
			parts.push(
				`Removido(s) ${removedChannels.map((c) => `#${c}`).join(', ')} da lista de permissões.`,
			);
		}
		if (addedRoles.length > 0) {
			parts.push(
				`Adicionado(s) o(s) cargo(s) ${addedRoles.map((r) => `\`${r}\``).join(', ')} à lista de permissões.`,
			);
		}
		if (removedRoles.length > 0) {
			parts.push(
				`Removido(s) o(s) cargo(s) ${removedRoles.map((r) => `\`${r}\``).join(', ')} da lista de permissões.`,
			);
		}
		if (notFoundChannels.length > 0) {
			parts.push(
				`Não foi possível encontrar: ${notFoundChannels.map((c) => `#${c}`).join(', ')}. Verifique se há letras maiúsculas nos nomes dos canais.`,
			);
		}
		if (parts.length === 0) {
			return 'Lista de permissões do spam monitor salva — nenhuma alteração.';
		}
		return `Lista de permissões do spam monitor atualizada. ${parts.join(' ')}`;
	},
};
export const configModalText = {
	title: 'Configuração do SpamMonitor',
	header: 'Escolha uma seção abaixo para configurar.',
	configureButton: 'Configurar',
};
export const slashNotifications = {
	NO_FLAGGED_USERS: 'Nenhum usuário sinalizado no momento.',
	NO_PERMISSION: 'Você não tem permissão para usar este comando.',
	ADMIN_CHANNEL_ONLY:
		'Este comando só pode ser usado no canal de administração.',
	NO_FLAGGED_USERS_FILTER: (filter: string) =>
		`Nenhum usuário sinalizado encontrado para o filtro: *${filter}*.`,
	USER_NOT_FOUND: (username: string) =>
		`Usuário *@${username}* não encontrado ou sem registro de spam.`,
	MANAGE_MISSING_USERNAME: 'Uso: `/spammonitor manage <username>`',
	LEVEL_MISSING_LEVEL: 'Uso: `/spammonitor level`',
	SCHEDULE_MISSING_TRIGGER: 'Uso: `/spammonitor schedule`',
	CONFIG_MISSING_TRIGGER: 'Uso: `/spammonitor config`',
};

export const slashCommandHelp = {
	HELP:
		'*Comandos do SpamMonitor*\n' +
		'`/spammonitor list all` — todos os usuários sinalizados, do nível mais alto ao mais baixo\n' +
		'`/spammonitor list timeout` — usuários atualmente em período de espera ativo\n' +
		'`/spammonitor list <Level>` — usuários em um nível específico, ex.: `list review` para usuários em revisão administrativa\n' +
		'`/spammonitor manage <username>` — abrir controles administrativos para um usuário sinalizado\n' +
		'`/spammonitor level` — configurar ação e notificação por nível de spam\n' +
		'`/spammonitor schedule` — configurar o relatório diário anti-spam\n' +
		'`/spammonitor config` — configurar a lista de permissões de canais e cargos isentos do monitoramento de spam',
};

export const languageModalText = {
	title: 'Configurações de Idioma',
	header: 'Selecione seu idioma preferido para mensagens do bot, modais e notificações.',
	selectLabel: 'Idioma',
	selectPlaceholder: 'Escolha um idioma',
};

export const commonModalText = {
	cancel: 'Cancelar',
	submit: 'Enviar',
	edit: 'Editar',
	close: 'Fechar',
	save: 'Salvar',
};
export const languageNotification = {
	LanguageChanged: (languageLabel: string) =>
		`Sua preferência de idioma foi alterada para *${languageLabel}*.`,
};

export const EditLevelModalStrings = {
	modalTitle: (levelLabelText: string) => `Editar — ${levelLabelText}`,
	headerTitle: (levelLabelText: string) => `*Editando: ${levelLabelText}*`,
	backToOverviewButton: '← Voltar para a Visão Geral',
	resetToDefaultButton: 'Redefinir para Padrões',
	actionSelectLabel: 'Ação',
	actionSelectPlaceholder: 'Selecione uma ação',
	timeoutPlaceholder: (defaultTimeout: number) => `ex.: ${defaultTimeout}`,
};
export const LevelOverviewModalStrings = {
	modalTitle: 'Configuração de Nível',
	actionSummaryPrefix: (levelLabelText: string, actionSummary: string) =>
		`*${levelLabelText}*\nAção: ${actionSummary}`,
	messagePreviewPrefix: (messagePreview: string) =>
		`Mensagem: ${messagePreview}`,
	noCustomMessage: '_Nenhuma mensagem personalizada (padrão em uso)_',
	messagePreviewTruncated: (preview: string) => `_"${preview}…"_`,
	messagePreviewFull: (preview: string) => `_"${preview}"_`,
};
export const ManageUserModalStrings = {
	modalTitle: (username: string) => `Gerenciar @${username}`,
	userLabel: (username: string) => `*Usuário:* @${username}`,
	spamLevelFieldLabel: (levelLabelText: string) =>
		`*Nível de Spam:*\n${levelLabelText}`,
	cooldownFieldLabel: (cooldownText: string) =>
		`*Período de Espera:*\n${cooldownText}`,
	lastEscalationFieldLabel: (dateText: string) =>
		`*Última Escalada:*\n${dateText}`,
	actionsHeader: '*Ações Administrativas*',
	vouchButtonFallback: 'Avalizar',
	resetCooldownButtonFallback: 'Redefinir Período de Espera',
	levelDownButtonFallback: 'Reduzir Nível',
	resetToCleanButtonFallback: 'Redefinir para Clean',
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
		`Total sinalizados: *${total}* | ` +
		`Monitorados: *${monitored}* | ` +
		`Restritos: *${restricted}* | ` +
		`Suspensos: *${suspended}* | ` +
		`Aguardando revisão: *${adminReview}* | ` +
		`Em período de espera: *${timedOut}*`,
	userRowLine: (username: string, label: string, cooldownStr: string) =>
		`@${username} — *${label}*${cooldownStr}`,
	cooldownSuffix: (formattedDate: string) =>
		` | período de espera até ${formattedDate} UTC`,
	manageUserOverflowOption: 'Gerenciar usuário',
	listHeader: (summary: string, title: string) => `${summary}\n\n*${title}*`,
	listTitleSuffix: (title: string) => `Usuários ${title}`,
	allFlaggedUsersTitle: 'Todos os Usuários Sinalizados',
	pendingAdminReviewTitle: 'Aguardando Revisão Administrativa',
	unknownLevelError: (levelName: string, validLevels: string) =>
		`Nível desconhecido *${levelName}*. Níveis válidos: ${validLevels}.\n` +
		`Para usuários em revisão administrativa, use \`list review\`.`,
	activeTimeoutTitle: 'Usuários em Período de Espera Ativo',
	activeTimeoutFilterKey: 'período de espera ativo',
};
export const configEntriesText = {
	whitelist: {
		label: 'Lista de permissões',
		description:
			'Canais e funções totalmente excluídos do monitoramento de spam.',
	},
	language: {
		label: 'Idioma',
		description: 'Escolha o idioma usado para mensagens e modais do bot.',
	},
};
