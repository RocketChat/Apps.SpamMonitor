import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import {
	ActionsBlock,
	BlockElementType,
	InputBlock,
	LayoutBlockType,
	PlainTextInputElement,
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
import { Translations } from '../definition/languagepreference';
import { LevelConfigDiff } from '../definition/editmodal';
import {
	button,
	divider,
	getState,
	modalShell,
	section,
} from '../lib/utils/UiKitHandler';

export async function buildEditLevelModal(
	read: IRead,
	appId: string,
	level: SpammingLevel,
	t: Translations,
): Promise<IUIKitSurfaceViewParam> {
	const config = await LevelConfigStore.get(read, level);
	const defaults = DEFAULT_LEVEL_CONFIGS[level];
	const defaultTimeout = defaults.timeoutSeconds ?? 60;
	const initialTimeout = config.timeoutSeconds ?? defaultTimeout;
	const initialPlaceholderMessage =
		t.LevelConfigStrings.defaultNotificationInputPlaceholder;

	const allowed = actionOptionsFor(level);
	const initialAction: LevelActionType = allowed.includes(config.action)
		? config.action
		: allowed[0];

	const headerBlock = section(
		t.EditLevelModalStrings.headerTitle(levelLabel(level)) +
			'\n' +
			t.LevelConfigStrings.headerText,
	);

	const actionButtonsBlock: ActionsBlock = {
		type: LayoutBlockType.ACTIONS,
		blockId: EditLevelBlockId.ACTION_BUTTONS,
		elements: [
			button({
				appId,
				blockId: EditLevelBlockId.ACTION_BUTTONS,
				actionId: EditLevelActionId.BACK_TO_OVERVIEW,
				label: t.EditLevelModalStrings.backToOverviewButton,
				emoji: true,
				value: String(level),
			}),
			button({
				appId,
				blockId: EditLevelBlockId.ACTION_BUTTONS,
				actionId: `${EditLevelActionId.RESET_TO_DEFAULT}_${level}`,
				label: t.EditLevelModalStrings.resetToDefaultButton,
				emoji: true,
				value: String(level),
			}),
		],
	};

	const actionSelectBlock: InputBlock = {
		type: LayoutBlockType.INPUT,
		blockId: EditLevelBlockId.ACTION_SELECT,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: t.EditLevelModalStrings.actionSelectLabel,
			emoji: true,
		},
		element: {
			type: BlockElementType.STATIC_SELECT,
			appId,
			blockId: EditLevelBlockId.ACTION_SELECT,
			actionId: EditLevelActionId.ACTION_SELECT,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: t.EditLevelModalStrings.actionSelectPlaceholder,
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
		type: LayoutBlockType.INPUT,
		blockId: EditLevelBlockId.TIMEOUT_INPUT,
		optional: true,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: t.LevelConfigStrings.timeoutLabel,
			emoji: true,
		},
		element: {
			type: BlockElementType.PLAIN_TEXT_INPUT,
			appId,
			blockId: EditLevelBlockId.TIMEOUT_INPUT,
			actionId: EditLevelActionId.TIMEOUT_INPUT,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: t.EditLevelModalStrings.timeoutPlaceholder(
					defaultTimeout,
				),
			},
			initialValue: String(initialTimeout),
		} as PlainTextInputElement,
	};

	const messageBlock: InputBlock = {
		type: LayoutBlockType.INPUT,
		blockId: EditLevelBlockId.MESSAGE_INPUT,
		optional: true,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: t.LevelConfigStrings.customNotificationLabel,
		},
		hint: {
			type: TextObjectType.PLAIN_TEXT,
			text: t.LevelConfigStrings.customNotificationHint,
		},
		element: {
			type: BlockElementType.PLAIN_TEXT_INPUT,
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

	return modalShell({
		id: `${EDIT_LEVEL_MODAL_ID}_${level}`,
		title: t.EditLevelModalStrings.modalTitle(levelLabel(level)),
		titleEmoji: true,
		blocks: [
			headerBlock,
			divider(),
			actionButtonsBlock,
			actionSelectBlock,
			timeoutBlock,
			messageBlock,
		],
		submit: button({
			appId,
			blockId: EditLevelBlockId.SUBMIT_BTN,
			actionId: `${EditLevelActionId.SUBMIT}_${level}`,
			label: t.commonModalText.submit,
			style: 'success',
		}),
		close: button({
			appId,
			blockId: EditLevelBlockId.CLOSE_BTN,
			actionId: EditLevelActionId.CLOSE,
			label: t.commonModalText.cancel,
			style: 'danger',
		}),
	});
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

	const actionRaw = getState(
		state,
		EditLevelBlockId.ACTION_SELECT,
		EditLevelActionId.ACTION_SELECT,
	);
	const timeoutRaw = getState(
		state,
		EditLevelBlockId.TIMEOUT_INPUT,
		EditLevelActionId.TIMEOUT_INPUT,
	);
	const messageRaw =
		getState(
			state,
			EditLevelBlockId.MESSAGE_INPUT,
			EditLevelActionId.MESSAGE_INPUT,
		) ?? '';

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
