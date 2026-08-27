import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';
import { DividerBlock, SectionBlock } from '@rocket.chat/ui-kit';
import { Translations } from '../definition/languagepreference';
import {
	CONFIG_ENTRIES,
	CONFIG_OVERVIEW_MODAL_ID,
	ConfigActionId,
	ConfigBlockId,
} from '../definition/config';
import {
	button,
	divider,
	modalShell,
	section,
} from '../lib/utils/UiKitHandler';

export function buildConfigOverviewModal(
	appId: string,
	t: Translations,
): IUIKitSurfaceViewParam {
	const headerBlock: SectionBlock = section(t.configModalText.header);
	const topDivider: DividerBlock = divider();

	const rowBlocks = CONFIG_ENTRIES.reduce<Array<SectionBlock | DividerBlock>>(
		(acc, entry) => {
			const { label, description } = t.configEntriesText[entry.id];
			const sectionBlock: SectionBlock = section(
				`*${label}*\n${description}`,
				{
					blockId: `${ConfigBlockId.ITEM_ROW_PREFIX}${entry.id}`,
					accessory: button({
						appId,
						blockId: `${ConfigBlockId.ITEM_BTN_PREFIX}${entry.id}`,
						actionId: `${ConfigActionId.OPEN_ITEM_PREFIX}${entry.id}`,
						label: t.configModalText.configureButton,
						emoji: true,
						style: ButtonStyle.PRIMARY,
						value: entry.id,
					}),
				},
			);
			acc.push(sectionBlock, divider());
			return acc;
		},
		[],
	);

	return modalShell({
		id: CONFIG_OVERVIEW_MODAL_ID,
		title: t.configModalText.title,
		titleEmoji: true,
		blocks: [headerBlock, topDivider, ...rowBlocks],
		close: button({
			appId,
			blockId: ConfigBlockId.CLOSE_BTN,
			actionId: ConfigActionId.CLOSE,
			label: t.commonModalText.cancel,
		}),
	});
}
