import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	ActionsBlock,
	ButtonElement,
	DividerBlock,
	InputBlock,
	PlainTextInputElement,
	SectionBlock,
	StaticSelectElement,
	TextObjectType,
} from '@rocket.chat/ui-kit';
import {
	actionOptionsFor,
	CONFIGURABLE_LEVELS,
	DEFAULT_LEVEL_CONFIGS,
	LEVEL_ACTION_LABELS,
	LevelActionType,
	LevelConfig,
	levelLabel,
} from '../definition/levelConfig';
import { SpammingLevel } from '../definition/spamlevel';
import { LevelConfigStore } from '../persistence/levelConfigStore';
import {
	EDIT_LEVEL_MODAL_ID,
	EditLevelActionId,
	EditLevelBlockId,
} from '../enums/modals/levelConfig';
import { LevelConfigStrings } from '../lib/translations/locals/en';
import { LevelConfigDiff } from '../definition/editmodal';

export async function buildEditLevelModal(
	read: IRead,
	appId: string,
	level: SpammingLevel,
): Promise<IUIKitSurfaceViewParam> {
	const config = await LevelConfigStore.get(read, level);
	const defaults = DEFAULT_LEVEL_CONFIGS[level];
	const defaultTimeout = defaults.timeoutSeconds ?? 60;
	const initialTimeout = config.timeoutSeconds ?? defaultTimeout;
	const initialPlaceholderMessage =
		LevelConfigStrings.defaultNotificationInputPlaceholder;

	const allowed = actionOptionsFor(level);
	const initialAction: LevelActionType = allowed.includes(config.action)
		? config.action
		: allowed[0];

	const headerBlock: SectionBlock = {
		type: 'section',
		text: {
			type: TextObjectType.MRKDWN,
			text:
				`*Editing: ${levelLabel(level)}*\n` +
				LevelConfigStrings.headerText,
		},
	};

	const divider: DividerBlock = { type: 'divider' };

	const actionButtonsBlock: ActionsBlock = {
		type: 'actions',
		blockId: EditLevelBlockId.ACTION_BUTTONS,
		elements: [
			{
				type: 'button',
				appId,
				blockId: EditLevelBlockId.ACTION_BUTTONS,
				actionId: EditLevelActionId.BACK_TO_OVERVIEW,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: '← Back to Overview',
					emoji: true,
				},
				value: String(level),
			} as ButtonElement,
			{
				type: 'button',
				appId,
				blockId: EditLevelBlockId.ACTION_BUTTONS,
				actionId: `${EditLevelActionId.RESET_TO_DEFAULT}_${level}`,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: 'Reset to Defaults',
					emoji: true,
				},
				value: String(level),
			} as ButtonElement,
		],
	};

	const actionSelectBlock: InputBlock = {
		type: 'input',
		blockId: EditLevelBlockId.ACTION_SELECT,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: 'Action',
			emoji: true,
		},
		element: {
			type: 'static_select',
			appId,
			blockId: EditLevelBlockId.ACTION_SELECT,
			actionId: EditLevelActionId.ACTION_SELECT,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: 'Select an action',
			},
			initialValue: initialAction,
			options: allowed.map((act) => ({
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: LEVEL_ACTION_LABELS[act],
					emoji: true,
				},
				value: act,
			})),
		} as StaticSelectElement,
	};

	const timeoutBlock: InputBlock = {
		type: 'input',
		blockId: EditLevelBlockId.TIMEOUT_INPUT,
		optional: true,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: LevelConfigStrings.timeoutLabel,
			emoji: true,
		},
		element: {
			type: 'plain_text_input',
			appId,
			blockId: EditLevelBlockId.TIMEOUT_INPUT,
			actionId: EditLevelActionId.TIMEOUT_INPUT,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: `e.g. ${defaultTimeout}`,
			},
			initialValue: String(initialTimeout),
		} as PlainTextInputElement,
	};

	const messageBlock: InputBlock = {
		type: 'input',
		blockId: EditLevelBlockId.MESSAGE_INPUT,
		optional: true,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: LevelConfigStrings.customNotificationLabel,
		},
		hint: {
			type: TextObjectType.PLAIN_TEXT,
			text: LevelConfigStrings.customNotificationHint,
		},
		element: {
			type: 'plain_text_input',
			appId,
			blockId: EditLevelBlockId.MESSAGE_INPUT,
			actionId: EditLevelActionId.MESSAGE_INPUT,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: initialPlaceholderMessage,
			},
			initialValue: config.message ?? initialPlaceholderMessage,
			multiline: true,
		} as PlainTextInputElement,
	};

	return {
		id: `${EDIT_LEVEL_MODAL_ID}_${level}`,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: TextObjectType.PLAIN_TEXT,
			text: `Edit — ${levelLabel(level)}`,
			emoji: true,
		},
		blocks: [
			headerBlock,
			divider,
			actionButtonsBlock,
			actionSelectBlock,
			timeoutBlock,
			messageBlock,
		],
		submit: {
			type: 'button',
			appId,
			style: 'success',
			blockId: EditLevelBlockId.SUBMIT_BTN,
			actionId: `${EditLevelActionId.SUBMIT}_${level}`,
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Save' },
		},
		close: {
			type: 'button',
			appId,
			style: 'danger',
			blockId: EditLevelBlockId.CLOSE_BTN,
			actionId: EditLevelActionId.CLOSE,
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Cancel' },
		},
	};
}

export function parseEditLevelConfig(
	state: Record<string, Record<string, unknown>>,
	level: SpammingLevel,
	fallback?: LevelConfig,
): LevelConfig | undefined {
	if (!CONFIGURABLE_LEVELS.includes(level)) return undefined;

	const actionBlock = state?.[EditLevelBlockId.ACTION_SELECT];
	const timeoutBlock = state?.[EditLevelBlockId.TIMEOUT_INPUT];
	const messageBlock = state?.[EditLevelBlockId.MESSAGE_INPUT];

	if (!actionBlock && !timeoutBlock && !messageBlock) return undefined;

	const actionRaw = actionBlock?.[EditLevelActionId.ACTION_SELECT];
	const timeoutRaw = timeoutBlock?.[EditLevelActionId.TIMEOUT_INPUT];
	const messageRaw = messageBlock?.[EditLevelActionId.MESSAGE_INPUT] ?? '';

	const allowed = actionOptionsFor(level);
	const defaults = DEFAULT_LEVEL_CONFIGS[level];
	const fb: LevelConfig =
		fallback && fallback.level === level ? fallback : defaults;

	let action: LevelActionType;
	if (allowed.includes(actionRaw as LevelActionType)) {
		action = actionRaw as LevelActionType;
	} else if (allowed.includes(fb.action)) {
		action = fb.action;
	} else {
		action = allowed[0];
	}

	let timeoutSeconds: number | undefined;
	if (action === 'timeout') {
		const parsed = parseInt(String(timeoutRaw ?? ''), 10);
		timeoutSeconds =
			Number.isFinite(parsed) && parsed > 0
				? parsed
				: (fb.timeoutSeconds ?? defaults.timeoutSeconds ?? 60);
	}

	return {
		level,
		action,
		timeoutSeconds,
		message: typeof messageRaw === 'string' ? messageRaw.trim() : '',
	};
}

export function parseLevelFromEditModalId(
	viewId: string,
): SpammingLevel | undefined {
	const prefix = `${EDIT_LEVEL_MODAL_ID}_`;
	if (!viewId.startsWith(prefix)) return undefined;
	const parsed = parseInt(viewId.slice(prefix.length), 10);
	return CONFIGURABLE_LEVELS.includes(parsed as SpammingLevel)
		? (parsed as SpammingLevel)
		: undefined;
}

export function diffLevelConfig(
	before: LevelConfig,
	after: LevelConfig,
): LevelConfigDiff {
	return {
		action: before.action !== after.action,
		timeoutSeconds: before.timeoutSeconds !== after.timeoutSeconds,
		message:
			(before.message?.trim() ?? '') !== (after.message?.trim() ?? ''),
	};
}

export function hasChanges(diff: LevelConfigDiff): boolean {
	return diff.action || diff.timeoutSeconds || diff.message;
}

export function formatConfigChangeSummary(
	level: SpammingLevel,
	before: LevelConfig,
	after: LevelConfig,
	diff: LevelConfigDiff,
): string {
	const lines: string[] = [`*${levelLabel(level)}* configuration updated:`];

	if (diff.action) {
		lines.push(
			`• Action: _${LEVEL_ACTION_LABELS[before.action]}_ → _${LEVEL_ACTION_LABELS[after.action]}_`,
		);
	}
	if (diff.timeoutSeconds) {
		const bSec =
			before.timeoutSeconds != null
				? `${before.timeoutSeconds}s`
				: '_(none)_';
		const aSec =
			after.timeoutSeconds != null
				? `${after.timeoutSeconds}s`
				: '_(none)_';
		lines.push(`• Timeout: ${bSec} → ${aSec}`);
	}
	if (diff.message) {
		const bMsg = before.message?.trim()
			? `"${before.message.trim()}"`
			: '_(default)_';
		const aMsg = after.message?.trim()
			? `"${after.message.trim()}"`
			: '_(default)_';
		lines.push(`• Message: ${bMsg} → ${aMsg}`);
	}

	return lines.join('\n');
}
