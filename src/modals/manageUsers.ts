import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import {
	ActionsBlock,
	ButtonElement,
	DividerBlock,
	LayoutBlockType,
	SectionBlock,
} from '@rocket.chat/ui-kit';
import {
	UserSpamRecord,
	SPAMMING_LEVEL_LABELS,
	SpammingLevel,
} from '../definition/spamlevel';
import {
	ManageUserActionId,
	MANAGE_USER_MODAL_ID,
	BlockId,
} from '../enums/modals/manageUsers';
import { formatCooldown, formatDate } from '../lib/utils/messageUtils';
import { Translations } from '../definition/languagepreference';
import {
	button,
	divider,
	modalShell,
	mrkdwn,
	section,
} from '../lib/utils/UiKitHandler';

// Falls back to a plain label if an action is ever missing from ConfirmActionMeta
function buttonLabel(
	t: Translations,
	action: ManageUserActionId,
	fallback: string,
): string {
	return t.ConfirmActionMeta[action]?.confirmLabel ?? fallback;
}

function buildActionButton(
	t: Translations,
	appId: string,
	confirmActionId: ManageUserActionId,
	labelAction: ManageUserActionId,
	fallbackLabel: string,
	userId: string,
	style?: ButtonElement['style'],
): ButtonElement {
	return button({
		appId,
		blockId: BlockId.ACTIONS,
		actionId: confirmActionId,
		label: buttonLabel(t, labelAction, fallbackLabel),
		value: userId,
		style,
	});
}

export function buildManageUserModal(
	record: UserSpamRecord,
	appId: string,
	t: Translations,
): IUIKitSurfaceViewParam {
	const levelLabel =
		SPAMMING_LEVEL_LABELS[record.spammingLevel] ??
		String(record.spammingLevel);
	const isOnCooldown =
		record.cooldownUntil > 0 && Date.now() < record.cooldownUntil;
	const isClean = record.spammingLevel === SpammingLevel.Clean;

	const userInfoBlock = section(
		t.ManageUserModalStrings.userLabel(record.username),
		{ blockId: BlockId.USER_INFO },
	);

	const detailsBlock: SectionBlock = {
		type: LayoutBlockType.SECTION,
		blockId: BlockId.DETAILS,
		fields: [
			mrkdwn(t.ManageUserModalStrings.spamLevelFieldLabel(levelLabel)),
			mrkdwn(
				t.ManageUserModalStrings.cooldownFieldLabel(
					formatCooldown(record.cooldownUntil),
				),
			),
			mrkdwn(
				t.ManageUserModalStrings.lastEscalationFieldLabel(
					formatDate(record.lastEscalation),
				),
			),
		],
	};

	const dividerBlock: DividerBlock = divider(BlockId.DIVIDER);

	const actionsHeaderBlock = section(t.ManageUserModalStrings.actionsHeader, {
		blockId: BlockId.ACTIONS_HEADER,
	});

	const actionButtons: ButtonElement[] = [
		buildActionButton(
			t,
			appId,
			ManageUserActionId.CONFIRM_VOUCH,
			ManageUserActionId.VOUCH,
			t.ManageUserModalStrings.vouchButtonFallback,
			record.userId,
			'primary',
		),
		...(isOnCooldown
			? [
					buildActionButton(
						t,
						appId,
						ManageUserActionId.CONFIRM_RESET_COOLDOWN,
						ManageUserActionId.RESET_COOLDOWN,
						t.ManageUserModalStrings.resetCooldownButtonFallback,
						record.userId,
					),
				]
			: []),
		...(!isClean
			? [
					buildActionButton(
						t,
						appId,
						ManageUserActionId.CONFIRM_RESET_LEVEL_DOWN,
						ManageUserActionId.RESET_LEVEL_DOWN,
						t.ManageUserModalStrings.levelDownButtonFallback,
						record.userId,
					),
					buildActionButton(
						t,
						appId,
						ManageUserActionId.CONFIRM_RESET_LEVEL_CLEAN,
						ManageUserActionId.RESET_LEVEL_CLEAN,
						t.ManageUserModalStrings.resetToCleanButtonFallback,
						record.userId,
						'danger',
					),
				]
			: []),
	];

	const actionsBlock: ActionsBlock = {
		type: LayoutBlockType.ACTIONS,
		blockId: BlockId.ACTIONS,
		elements: actionButtons,
	};

	const blocks = [
		userInfoBlock,
		detailsBlock,
		dividerBlock,
		actionsHeaderBlock,
		actionsBlock,
	];

	return modalShell({
		id: MANAGE_USER_MODAL_ID,
		title: t.ManageUserModalStrings.modalTitle(record.username),
		blocks,
		close: button({
			appId,
			blockId: BlockId.CLOSE,
			actionId: 'manage_user_close_action',
			label: t.commonModalText.cancel,
			style: 'danger',
		}),
	});
}
