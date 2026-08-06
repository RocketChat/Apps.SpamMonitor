import { ScheduleDraft, ScheduleRecord } from '../definition/scheduleReports';
import {
	CADENCE_PRESET_DAYS,
	CadencePreset,
	SCHEDULE_SETUP_MODAL_ID,
	ScheduleActionId,
	ScheduleBlockId,
} from '../enums/modals/scheduleReports';
import {
	ActionsBlock,
	ButtonElement,
	ContextBlock,
	DividerBlock,
	InputBlock,
	SectionBlock,
	TextObjectType,
} from '@rocket.chat/ui-kit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import {
	computeNextRunPreview,
	formatOffset,
	formatTime12h,
} from '../core/scheduleCron';
import {
	commonModalText,
	scheduleSetupModalText as msg,
} from '../lib/translations/locals/en';

const DAY_OPTIONS = [
	{ text: msg.days.sun, value: '0' },
	{ text: msg.days.mon, value: '1' },
	{ text: msg.days.tue, value: '2' },
	{ text: msg.days.wed, value: '3' },
	{ text: msg.days.thu, value: '4' },
	{ text: msg.days.fri, value: '5' },
	{ text: msg.days.sat, value: '6' },
];

const CADENCE_LABELS: Record<CadencePreset, string> = {
	[CadencePreset.DAILY]: msg.cadenceLabels.daily,
	[CadencePreset.WEEKDAYS]: msg.cadenceLabels.weekdays,
	[CadencePreset.WEEKLY]: msg.cadenceLabels.weekly,
	[CadencePreset.CUSTOM]: msg.cadenceLabels.custom,
};

export function buildScheduleSetupModal(
	appId: string,
	existing?: ScheduleRecord | null,
	confirmDraft?: ScheduleDraft | null,
	mode: 'setup' | 'confirm' | 'delete' = confirmDraft ? 'confirm' : 'setup',
): IUIKitModalViewParam {
	if (mode === 'delete') {
		if (!existing) {
			return buildScheduleSetupModal(appId, existing, null, 'setup');
		}
		return buildDeleteConfirmBlocks(appId, existing);
	}

	if (confirmDraft) {
		return buildConfirmStageBlocks(appId, confirmDraft, !!existing);
	}

	const preset = existing?.preset ?? CadencePreset.DAILY;
	const initialDays = existing?.days ?? [];
	const headerText = existing
		? msg.setup.headerExisting(describeExisting(existing))
		: msg.setup.headerDefault;

	const headerBlock: SectionBlock = {
		type: 'section',
		blockId: ScheduleBlockId.HEADER,
		text: { type: TextObjectType.MRKDWN, text: headerText },
	};

	const blocks: (
		| SectionBlock
		| ActionsBlock
		| DividerBlock
		| InputBlock
		| ContextBlock
	)[] = [headerBlock];

	if (existing) {
		const deleteActionsBlock: ActionsBlock = {
			type: 'actions',
			blockId: ScheduleBlockId.DELETE_BTN,
			elements: [
				{
					type: 'button',
					appId,
					blockId: ScheduleBlockId.DELETE_BTN,
					actionId: ScheduleActionId.DELETE,
					style: 'danger',
					text: {
						type: TextObjectType.PLAIN_TEXT,
						text: msg.setup.deleteButton,
					},
				},
			],
		};
		blocks.push(deleteActionsBlock);
	}

	const dividerBlock: DividerBlock = {
		type: 'divider',
		blockId: ScheduleBlockId.DIVIDER,
	};

	const cadenceSelectBlock: InputBlock = {
		type: 'input',
		blockId: ScheduleBlockId.CADENCE_SELECT,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: msg.setup.cadenceLabel,
		},
		element: {
			type: 'static_select',
			appId,
			blockId: ScheduleBlockId.CADENCE_SELECT,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: msg.setup.cadencePlaceholder,
			},
			actionId: ScheduleActionId.CADENCE_SELECT,
			initialValue: preset,
			options: [
				CadencePreset.DAILY,
				CadencePreset.WEEKDAYS,
				CadencePreset.WEEKLY,
				CadencePreset.CUSTOM,
			].map((p) => ({
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: CADENCE_LABELS[p],
				},
				value: p,
			})),
		},
	};

	const cadenceHintBlock: ContextBlock = {
		type: 'context',
		blockId: ScheduleBlockId.CADENCE_HINT,
		elements: [
			{ type: TextObjectType.MRKDWN, text: msg.setup.cadenceHint },
		],
	};

	const daySelectBlock: InputBlock = {
		type: 'input',
		blockId: ScheduleBlockId.DAY_MULTISELECT,
		optional: true,
		label: { type: TextObjectType.PLAIN_TEXT, text: msg.setup.daysLabel },
		element: {
			type: 'multi_static_select',
			appId,
			blockId: ScheduleBlockId.DAY_MULTISELECT,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: msg.setup.daysPlaceholder,
			},
			actionId: ScheduleActionId.DAY_MULTISELECT,
			initialValue: initialDays.map(String),
			options: DAY_OPTIONS.map((d) => ({
				text: { type: TextObjectType.PLAIN_TEXT, text: d.text },
				value: d.value,
			})),
		},
	};

	const timeInputBlock: InputBlock = {
		type: 'input',
		blockId: ScheduleBlockId.TIME_INPUT,
		label: { type: TextObjectType.PLAIN_TEXT, text: msg.setup.timeLabel },
		element: {
			type: 'time_picker',
			appId,
			blockId: ScheduleBlockId.TIME_INPUT,
			actionId: ScheduleActionId.TIME_INPUT,
			initialTime: existing?.reportTime,
		},
	};

	blocks.push(
		dividerBlock,
		cadenceSelectBlock,
		cadenceHintBlock,
		daySelectBlock,
		timeInputBlock,
	);

	return {
		id: SCHEDULE_SETUP_MODAL_ID,
		title: { type: TextObjectType.PLAIN_TEXT, text: msg.setup.title },
		blocks,
		submit: {
			type: 'button',
			appId,
			blockId: ScheduleBlockId.SUBMIT_BTN,
			style: 'primary',
			actionId: ScheduleActionId.SUBMIT,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: msg.setup.previewButton,
			},
		} as ButtonElement,
		close: {
			type: 'button',
			appId,
			blockId: ScheduleBlockId.CLOSE_BTN,
			style: 'danger',
			actionId: ScheduleActionId.CLOSE,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: commonModalText.cancel,
			},
		} as ButtonElement,
	};
}

function buildConfirmStageBlocks(
	appId: string,
	draft: ScheduleDraft,
	hadExisting: boolean,
): IUIKitModalViewParam {
	const daysStr = draft.days.length
		? draft.days.map((d) => DAY_OPTIONS[d].text).join(', ')
		: msg.everyDay;
	const nextRun = computeNextRunPreview(
		draft.reportTime,
		draft.utcOffsetMinutes,
		draft.days,
	);
	const offsetLabel = formatOffset(draft.utcOffsetMinutes);

	const backBlock: ActionsBlock = {
		type: 'actions',
		blockId: ScheduleBlockId.BACK_BTN,
		elements: [
			{
				type: 'button',
				appId,
				blockId: ScheduleBlockId.BACK_BTN,
				actionId: ScheduleActionId.BACK,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: msg.confirm.backButton,
				},
			},
		],
	};

	const summaryBlock: SectionBlock = {
		type: 'section',
		blockId: ScheduleBlockId.CONFIRM_SUMMARY,
		text: {
			type: TextObjectType.MRKDWN,
			text: msg.confirm.summary(
				CADENCE_LABELS[draft.preset],
				daysStr,
				formatTime12h(draft.reportTime),
				offsetLabel,
				nextRun,
				hadExisting,
			),
		},
	};

	return {
		id: SCHEDULE_SETUP_MODAL_ID,
		title: { type: TextObjectType.PLAIN_TEXT, text: msg.confirm.title },
		blocks: [backBlock, summaryBlock],
		submit: {
			type: 'button',
			appId,
			blockId: ScheduleBlockId.CONFIRM_SUBMIT_BTN,
			style: 'primary',
			actionId: ScheduleActionId.SUBMIT,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: msg.confirm.confirmButton,
			},
		} as ButtonElement,
		close: {
			type: 'button',
			appId,
			blockId: ScheduleBlockId.CLOSE_BTN,
			style: 'danger',
			actionId: ScheduleActionId.CLOSE,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: commonModalText.cancel,
			},
		} as ButtonElement,
	};
}

function buildDeleteConfirmBlocks(
	appId: string,
	existing: ScheduleRecord,
): IUIKitModalViewParam {
	const daysStr = existing.days.length
		? existing.days.map((d) => DAY_OPTIONS[d].text).join(', ')
		: msg.everyDay;
	const offsetLabel = formatOffset(existing.utcOffsetMinutes);

	const backBlock: ActionsBlock = {
		type: 'actions',
		blockId: ScheduleBlockId.BACK_BTN,
		elements: [
			{
				type: 'button',
				appId,
				blockId: ScheduleBlockId.BACK_BTN,
				actionId: ScheduleActionId.BACK,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: msg.confirm.backButton,
				},
			},
		],
	};

	const summaryBlock: SectionBlock = {
		type: 'section',
		blockId: ScheduleBlockId.DELETE_SUMMARY,
		text: {
			type: TextObjectType.MRKDWN,
			text: msg.delete.summary(
				CADENCE_LABELS[existing.preset],
				daysStr,
				formatTime12h(existing.reportTime),
				offsetLabel,
			),
		},
	};

	return {
		id: SCHEDULE_SETUP_MODAL_ID,
		title: { type: TextObjectType.PLAIN_TEXT, text: msg.delete.title },
		blocks: [backBlock, summaryBlock],
		submit: {
			type: 'button',
			appId,
			blockId: ScheduleBlockId.DELETE_SUBMIT_BTN,
			style: 'danger',
			actionId: ScheduleActionId.SUBMIT,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: msg.delete.confirmButton,
			},
		} as ButtonElement,
		close: {
			type: 'button',
			appId,
			blockId: ScheduleBlockId.CLOSE_BTN,
			style: 'primary',
			actionId: ScheduleActionId.CLOSE,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: commonModalText.cancel,
			},
		} as ButtonElement,
	};
}

function describeExisting(record: ScheduleRecord): string {
	return `${CADENCE_LABELS[record.preset]} at ${formatTime12h(record.reportTime)}`;
}

export function parseScheduleSetupState(
	state: Record<string, Record<string, unknown>>,
	adminUserId: string,
	utcOffsetMinutes: number,
): ScheduleDraft | undefined {
	const presetRaw =
		state?.[ScheduleBlockId.CADENCE_SELECT]?.[
			ScheduleActionId.CADENCE_SELECT
		];
	const preset = Object.values(CadencePreset).includes(
		presetRaw as CadencePreset,
	)
		? (presetRaw as CadencePreset)
		: CadencePreset.DAILY;

	const daysRaw =
		state?.[ScheduleBlockId.DAY_MULTISELECT]?.[
			ScheduleActionId.DAY_MULTISELECT
		];
	const timeRaw =
		state?.[ScheduleBlockId.TIME_INPUT]?.[ScheduleActionId.TIME_INPUT];

	const reportTime = typeof timeRaw === 'string' ? timeRaw.trim() : '';
	if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(reportTime)) {
		return undefined;
	}

	let days: number[];
	if (preset === CadencePreset.CUSTOM) {
		const selected = Array.isArray(daysRaw) ? (daysRaw as string[]) : [];
		days = selected
			.map((v) => parseInt(v, 10))
			.filter((d) => d >= 0 && d <= 6);
	} else {
		days = CADENCE_PRESET_DAYS[preset];
	}

	return { adminUserId, preset, days, reportTime, utcOffsetMinutes };
}
