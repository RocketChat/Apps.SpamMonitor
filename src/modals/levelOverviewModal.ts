import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	ActionsBlock,
	ButtonElement,
	ContextBlock,
	DividerBlock,
	SectionBlock,
	TextObjectType,
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

	const headerBlock: SectionBlock = {
		type: 'section',
		text: {
			type: TextObjectType.MRKDWN,
			text: t.LevelConfigStrings.levelOverviewModalHeader,
		},
	};

	const topDivider: DividerBlock = { type: 'divider' };

	const levelBlocks = CONFIGURABLE_LEVELS.reduce<
		Array<SectionBlock | ContextBlock | ActionsBlock | DividerBlock>
	>((acc, level) => {
		const config = allConfigs[level] ?? DEFAULT_LEVEL_CONFIGS[level];

		const sectionBlock: SectionBlock = {
			type: 'section',
			blockId: `${OverviewBlockId.LEVEL_ROW_PREFIX}${level}`,
			text: {
				type: TextObjectType.MRKDWN,
				text: t.LevelOverviewModalStrings.actionSummaryPrefix(
					levelLabel(level),
					formatActionSummary(config),
				),
			},
			accessory: {
				type: 'button',
				appId,
				blockId: `${OverviewBlockId.EDIT_BTN_PREFIX}${level}`,
				actionId: `${OverviewActionId.EDIT_LEVEL_PREFIX}${level}`,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: t.commonModalText.edit,
					emoji: true,
				},
				value: String(level),
			} as ButtonElement,
		};

		const contextBlock: ContextBlock = {
			type: 'context',
			elements: [
				{
					type: TextObjectType.MRKDWN,
					text: t.LevelOverviewModalStrings.messagePreviewPrefix(
						formatMessagePreview(config, t),
					),
				},
			],
		};

		acc.push(sectionBlock, contextBlock, { type: 'divider' });
		return acc;
	}, []);

	return {
		id: LEVEL_OVERVIEW_MODAL_ID,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: TextObjectType.PLAIN_TEXT,
			text: t.LevelOverviewModalStrings.modalTitle,
			emoji: true,
		},
		blocks: [headerBlock, topDivider, ...levelBlocks],
		close: {
			type: 'button',
			appId,
			blockId: OverviewBlockId.CLOSE_BTN,
			actionId: OverviewActionId.CLOSE,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: t.commonModalText.close,
			},
		},
	};
}
