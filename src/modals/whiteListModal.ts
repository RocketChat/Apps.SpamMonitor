import {
	IRead,
	IUIKitSurfaceViewParam,
} from '@rocket.chat/apps-engine/definition/accessors';
import { WhitelistStore } from '../persistence/whiteListStore';
import { WHITELIST_OVERVIEW_MODAL_ID } from '../enums/whitelist';
import {
	BlockElementType,
	ContextBlock,
	LayoutBlockType,
	TextObjectType,
} from '@rocket.chat/ui-kit';
import { ActionId, BlockId } from '../enums/modals/whitelist';
import { Translations } from '../definition/languagepreference';
import {
	button,
	divider,
	modalShell,
	section,
} from '../lib/utils/UiKitHandler';

export async function buildWhitelistOverviewModal(
	read: IRead,
	appId: string,
	t: Translations,
): Promise<IUIKitSurfaceViewParam> {
	const { roomIds, roleIds } = await WhitelistStore.get(read);
	const roomLabels = await Promise.all(
		roomIds.map(async (id) => {
			const room = await read.getRoomReader().getById(id);
			return room?.slugifiedName ?? room?.displayName ?? id;
		}),
	);

	const channelHintBlock: ContextBlock = {
		type: LayoutBlockType.CONTEXT,
		blockId: BlockId.WHITELIST_CHANNEL_HINT,
		elements: [
			{
				type: TextObjectType.MRKDWN,
				text: t.whitelistModalText.channelListInputHint,
			},
		],
	};

	return modalShell({
		id: WHITELIST_OVERVIEW_MODAL_ID,
		title: t.whitelistModalText.whitelistModalTitle,
		blocks: [
			section(t.whitelistModalText.whitelistModalSubTitle),
			divider(),
			{
				type: LayoutBlockType.INPUT,
				blockId: BlockId.WHITELIST_CHANNEL_INPUT,
				optional: true,
				label: {
					type: TextObjectType.PLAIN_TEXT,
					text: t.whitelistModalText.channelListLabel,
				},
				element: {
					type: BlockElementType.PLAIN_TEXT_INPUT,
					appId,
					blockId: BlockId.WHITELIST_CHANNEL_INPUT,
					actionId: ActionId.CHANNEL_LIST_INPUT,
					multiline: true,
					initialValue: roomLabels.join(', '),
					placeholder: {
						type: TextObjectType.PLAIN_TEXT,
						text: t.whitelistModalText.channelListInputPlaceholder,
					},
				},
			},
			channelHintBlock,
			{
				type: LayoutBlockType.INPUT,
				blockId: BlockId.WHITELIST_ROLE_INPUT,
				optional: true,
				label: {
					type: TextObjectType.PLAIN_TEXT,
					text: t.whitelistModalText.roleListLabel,
				},
				element: {
					type: BlockElementType.PLAIN_TEXT_INPUT,
					appId,
					blockId: BlockId.WHITELIST_ROLE_INPUT,
					actionId: ActionId.ROLE_LIST_INPUT,
					multiline: true,
					initialValue: roleIds.join(', '),
					placeholder: {
						type: TextObjectType.PLAIN_TEXT,
						text: t.whitelistModalText.roleListInputPlaceholder,
					},
				},
			},
		],
		submit: button({
			appId,
			blockId: BlockId.WHITELIST_SAVE,
			actionId: ActionId.WHITELIST_SAVE,
			label: t.commonModalText.save,
		}),
		close: button({
			appId,
			blockId: BlockId.WHITELIST_CLOSE,
			actionId: ActionId.WHITELIST_CLOSE,
			label: t.commonModalText.cancel,
		}),
	});
}

export function parseWhitelistChannelListInput(
	state: Record<string, Record<string, unknown>>,
): string[] {
	const raw = state[BlockId.WHITELIST_CHANNEL_INPUT]?.[
		'channel_list_input'
	] as string | undefined;
	return splitCommaList(raw).map((name) => name.replace(/^#/, ''));
}

export function parseWhitelistRoleListInput(
	state: Record<string, Record<string, unknown>>,
): string[] {
	const raw = state[BlockId.WHITELIST_ROLE_INPUT]?.['role_list_input'] as
		| string
		| undefined;
	return splitCommaList(raw).map((r) => r.toLowerCase().replace(/\s+/g, '-'));
}

function splitCommaList(raw?: string): string[] {
	if (!raw) return [];
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}
