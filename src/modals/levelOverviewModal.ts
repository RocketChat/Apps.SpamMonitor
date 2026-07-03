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
import { LevelConfigStrings } from '../lib/translations/locals/en';

function formatActionSummary(config: LevelConfig): string {
	const actionLabel = LEVEL_ACTION_LABELS[config.action];
	if (config.action === 'timeout' && config.timeoutSeconds != null) {
		return `${actionLabel} — ${config.timeoutSeconds}s`;
	}
	return actionLabel;
}

function formatMessagePreview(config: LevelConfig): string {
	const msg = config.message?.trim();
	if (!msg) return '_No custom message (default used)_';
	const preview = msg.length > 80 ? `${msg.slice(0, 77)}…` : msg;
	return `_"${preview}"_`;
}

export async function buildLevelConfigOverviewModal(
	read: IRead,
	appId: string,
): Promise<IUIKitSurfaceViewParam> {
	const allConfigs = await LevelConfigStore.getAll(read);

	const headerBlock: SectionBlock = {
		type: 'section',
		text: {
			type: TextObjectType.MRKDWN,
			text: LevelConfigStrings.levelOverviewModalHeader,
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
				text: `*${levelLabel(level)}*\nAction: ${formatActionSummary(config)}`,
			},
			accessory: {
				type: 'button',
				appId,
				blockId: `${OverviewBlockId.EDIT_BTN_PREFIX}${level}`,
				actionId: `${OverviewActionId.EDIT_LEVEL_PREFIX}${level}`,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: 'Edit',
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
					text: `Message: ${formatMessagePreview(config)}`,
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
			text: 'Level Config',
			emoji: true,
		},
		blocks: [headerBlock, topDivider, ...levelBlocks],
		close: {
			type: 'button',
			appId,
			blockId: OverviewBlockId.CLOSE_BTN,
			actionId: OverviewActionId.CLOSE,
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Close' },
		},
	};
}
