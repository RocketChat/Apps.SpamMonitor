import {
	IRead,
	IUIKitSurfaceViewParam,
} from '@rocket.chat/apps-engine/definition/accessors';
import { WhitelistStore } from '../persistence/whiteListStore';
import { WHITELIST_OVERVIEW_MODAL_ID } from '../enums/whitelist';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	ContextBlock,
	SectionBlock,
	TextObjectType,
} from '@rocket.chat/ui-kit';
import { BlockId } from '../enums/modals/whitelist';
import { whitelistModalText } from '../lib/translations/locals/en';

export async function buildWhitelistOverviewModal(
	read: IRead,
	appId: string,
): Promise<IUIKitSurfaceViewParam> {
	const { roomIds, roleIds } = await WhitelistStore.get(read);
	const roomLabels = await Promise.all(
		roomIds.map(async (id) => {
			const room = await read.getRoomReader().getById(id);
			return room?.slugifiedName ?? room?.displayName ?? id;
		}),
	);

	const channelHintBlock: ContextBlock = {
		type: 'context',
		blockId: BlockId.WHITELIST_CHANNEL_HINT,
		elements: [
			{
				type: TextObjectType.MRKDWN,
				text: whitelistModalText.channelListInputHint,
			},
		],
	};

	return {
		id: WHITELIST_OVERVIEW_MODAL_ID,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: TextObjectType.PLAIN_TEXT,
			text: whitelistModalText.whitelistModalTitle,
		},
		submit: {
			type: 'button',
			appId,
			blockId: BlockId.WHITELIST_SAVE,
			actionId: 'whitelist_save',
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Save' },
		},
		close: {
			type: 'button',
			appId,
			blockId: BlockId.WHITELIST_CLOSE,
			actionId: 'whitelist_close',
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Cancel' },
		},
		blocks: [
			textSection(whitelistModalText.whitelistModalSubTitle),
			{ type: 'divider' },
			{
				type: 'input',
				blockId: BlockId.WHITELIST_CHANNEL_INPUT,
				optional: true,
				label: {
					type: TextObjectType.PLAIN_TEXT,
					text: whitelistModalText.channelListLabel,
				},
				element: {
					type: 'plain_text_input',
					appId,
					blockId: BlockId.WHITELIST_CHANNEL_INPUT,
					actionId: 'channel_list_input',
					multiline: true,
					initialValue: roomLabels.join(', '),
					placeholder: {
						type: TextObjectType.PLAIN_TEXT,
						text: whitelistModalText.channelListInputPlaceholder,
					},
				},
			},
			channelHintBlock,
			{
				type: 'input',
				blockId: BlockId.WHITELIST_ROLE_INPUT,
				optional: true,
				label: {
					type: TextObjectType.PLAIN_TEXT,
					text: whitelistModalText.roleListLabel,
				},
				element: {
					type: 'plain_text_input',
					appId,
					blockId: BlockId.WHITELIST_ROLE_INPUT,
					actionId: 'role_list_input',
					multiline: true,
					initialValue: roleIds.join(', '),
					placeholder: {
						type: TextObjectType.PLAIN_TEXT,
						text: whitelistModalText.roleListInputPlaceholder,
					},
				},
			},
		],
	};
}

function textSection(text: string): SectionBlock {
	return { type: 'section', text: { type: TextObjectType.MRKDWN, text } };
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
