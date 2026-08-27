import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import {
	ActionsBlock,
	ContextBlock,
	DividerBlock,
	LayoutBlockType,
	SectionBlock,
} from '@rocket.chat/ui-kit';
import {
	CONFIGURABLE_LEVELS,
	DEFAULT_LEVEL_CONFIGS,
	LEVEL_ACTION_LABELS,
	LevelConfig,
	levelLabel,
} from '../definition/levelConfig';
import { LevelConfigStore } from '../persistence/levelConfigStore';
import {
	LEVEL_OVERVIEW_MODAL_ID,
	OverviewActionId,
	OverviewBlockId,
} from '../enums/modals/levelConfig';
import { Translations } from '../definition/languagepreference';
import {
	button,
	divider,
	modalShell,
	mrkdwn,
	section,
} from '../lib/utils/UiKitHandler';

function formatActionSummary(config: LevelConfig): string {
	const actionLabel = LEVEL_ACTION_LABELS[config.action];
	if (config.action === 'timeout' && config.timeoutSeconds != null) {
		return `${actionLabel} — ${config.timeoutSeconds}s`;
	}
	return actionLabel;
}

function formatMessagePreview(config: LevelConfig, t: Translations): string {
	const msg = config.message?.trim();
	if (!msg) return t.LevelOverviewModalStrings.noCustomMessage;
	const preview = msg.length > 80 ? `${msg.slice(0, 77)}…` : msg;
	return t.LevelOverviewModalStrings.messagePreviewTruncated(preview);
}

export async function buildLevelConfigOverviewModal(
	read: IRead,
	appId: string,
	t: Translations,
): Promise<IUIKitSurfaceViewParam> {
	const allConfigs = await LevelConfigStore.getAll(read);

	const headerBlock = section(t.LevelConfigStrings.levelOverviewModalHeader);
	const topDivider: DividerBlock = divider();

	const levelBlocks = CONFIGURABLE_LEVELS.reduce<
		Array<SectionBlock | ContextBlock | ActionsBlock | DividerBlock>
	>((acc, level) => {
		const config = allConfigs[level] ?? DEFAULT_LEVEL_CONFIGS[level];

		const sectionBlock: SectionBlock = section(
			t.LevelOverviewModalStrings.actionSummaryPrefix(
				levelLabel(level),
				formatActionSummary(config),
			),
			{
				blockId: `${OverviewBlockId.LEVEL_ROW_PREFIX}${level}`,
				accessory: button({
					appId,
					blockId: `${OverviewBlockId.EDIT_BTN_PREFIX}${level}`,
					actionId: `${OverviewActionId.EDIT_LEVEL_PREFIX}${level}`,
					label: t.commonModalText.edit,
					emoji: true,
					value: String(level),
				}),
			},
		);

		const contextBlock: ContextBlock = {
			type: LayoutBlockType.CONTEXT,
			elements: [
				mrkdwn(
					t.LevelOverviewModalStrings.messagePreviewPrefix(
						formatMessagePreview(config, t),
					),
				),
			],
		};

		acc.push(sectionBlock, contextBlock, divider());
		return acc;
	}, []);

	return modalShell({
		id: LEVEL_OVERVIEW_MODAL_ID,
		title: t.LevelOverviewModalStrings.modalTitle,
		titleEmoji: true,
		blocks: [headerBlock, topDivider, ...levelBlocks],
		close: button({
			appId,
			blockId: OverviewBlockId.CLOSE_BTN,
			actionId: OverviewActionId.CLOSE,
			label: t.commonModalText.close,
		}),
	});
}
