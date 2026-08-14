import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import {
	ButtonStyle,
	UIKitSurfaceType,
} from '@rocket.chat/apps-engine/definition/uikit';
import {
	ButtonElement,
	DividerBlock,
	SectionBlock,
	TextObjectType,
} from '@rocket.chat/ui-kit';

import { configModalText } from '../lib/translations/locals/en';
import {
	CONFIG_ENTRIES,
	CONFIG_OVERVIEW_MODAL_ID,
	ConfigActionId,
	ConfigBlockId,
} from '../definition/config';

export function buildConfigOverviewModal(
	appId: string,
): IUIKitSurfaceViewParam {
	const headerBlock: SectionBlock = {
		type: 'section',
		text: {
			type: TextObjectType.MRKDWN,
			text: configModalText.header,
		},
	};

	const topDivider: DividerBlock = { type: 'divider' };

	const rowBlocks = CONFIG_ENTRIES.reduce<Array<SectionBlock | DividerBlock>>(
		(acc, entry) => {
			const sectionBlock: SectionBlock = {
				type: 'section',
				blockId: `${ConfigBlockId.ITEM_ROW_PREFIX}${entry.id}`,
				text: {
					type: TextObjectType.MRKDWN,
					text: `*${entry.label}*\n${entry.description}`,
				},
				accessory: {
					type: 'button',
					appId,
					style: ButtonStyle.PRIMARY,
					blockId: `${ConfigBlockId.ITEM_BTN_PREFIX}${entry.id}`,
					actionId: `${ConfigActionId.OPEN_ITEM_PREFIX}${entry.id}`,
					text: {
						type: TextObjectType.PLAIN_TEXT,
						text: configModalText.configureButton,
						emoji: true,
					},
					value: entry.id,
				} as ButtonElement,
			};

			acc.push(sectionBlock, { type: 'divider' });
			return acc;
		},
		[],
	);

	return {
		id: CONFIG_OVERVIEW_MODAL_ID,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: TextObjectType.PLAIN_TEXT,
			text: configModalText.title,
			emoji: true,
		},
		blocks: [headerBlock, topDivider, ...rowBlocks],
		close: {
			type: 'button',
			appId,
			blockId: ConfigBlockId.CLOSE_BTN,
			actionId: ConfigActionId.CLOSE,
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Close' },
		},
	};
}
