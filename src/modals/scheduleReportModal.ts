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
	BlockElementType,
	ButtonElement,
	ContextBlock,
	DividerBlock,
	InputBlock,
	LayoutBlockType,
	SectionBlock,
} from '@rocket.chat/ui-kit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import {
	computeNextRunPreview,
	formatOffset,
	formatTime12h,
} from '../core/scheduleCron';
import { Translations } from '../definition/languagepreference';
import {
	button,
	divider,
	getState,
	mrkdwn,
	plainText,
	section,
} from '../lib/utils/UiKitHandler';

export function buildScheduleSetupModal(
	appId: string,
	t: Translations,
	existing?: ScheduleRecord | null,
	confirmDraft?: ScheduleDraft | null,
	mode: 'setup' | 'confirm' | 'delete' = confirmDraft ? 'confirm' : 'setup',
): IUIKitModalViewParam {
	const msg = t.scheduleSetupModalText;

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

	if (mode === 'delete') {
		if (!existing) {
			return buildScheduleSetupModal(appId, t, existing, null, 'setup');
		}
		return buildDeleteConfirmBlocks(
			appId,
			t,
			existing,
			DAY_OPTIONS,
			CADENCE_LABELS,
		);
	}

	if (confirmDraft) {
		return buildConfirmStageBlocks(
			appId,
			t,
			confirmDraft,
			!!existing,
			DAY_OPTIONS,
			CADENCE_LABELS,
		);
	}

	const preset = existing?.preset ?? CadencePreset.DAILY;
	const initialDays = existing?.days ?? [];
	const headerText = existing
		? msg.setup.headerExisting(describeExisting(existing, CADENCE_LABELS))
		: msg.setup.headerDefault;

	const headerBlock: SectionBlock = section(headerText, {
		blockId: ScheduleBlockId.HEADER,
	});

	const blocks: (
		| SectionBlock
		| ActionsBlock
		| DividerBlock
		| InputBlock
		| ContextBlock
	)[] = [headerBlock];

	if (existing) {
		const deleteActionsBlock: ActionsBlock = {
			type: LayoutBlockType.ACTIONS,
			blockId: ScheduleBlockId.DELETE_BTN,
			elements: [
				button({
					appId,
					blockId: ScheduleBlockId.DELETE_BTN,
					actionId: ScheduleActionId.DELETE,
					label: msg.setup.deleteButton,
					style: 'danger',
				}),
			],
		};
		blocks.push(deleteActionsBlock);
	}

	const dividerBlock: DividerBlock = divider(ScheduleBlockId.DIVIDER);

	const cadenceSelectBlock: InputBlock = {
		type: LayoutBlockType.INPUT,
		blockId: ScheduleBlockId.CADENCE_SELECT,
		label: plainText(msg.setup.cadenceLabel),
		element: {
			type: BlockElementType.STATIC_SELECT,
			appId,
			blockId: ScheduleBlockId.CADENCE_SELECT,
			placeholder: plainText(msg.setup.cadencePlaceholder),
			actionId: ScheduleActionId.CADENCE_SELECT,
			initialValue: preset,
			options: [
				CadencePreset.DAILY,
				CadencePreset.WEEKDAYS,
				CadencePreset.WEEKLY,
				CadencePreset.CUSTOM,
			].map((p) => ({
				text: plainText(CADENCE_LABELS[p]),
				value: p,
			})),
		},
	};

	const cadenceHintBlock: ContextBlock = {
		type: LayoutBlockType.CONTEXT,
		blockId: ScheduleBlockId.CADENCE_HINT,
		elements: [mrkdwn(msg.setup.cadenceHint)],
	};

	const daySelectBlock: InputBlock = {
		type: LayoutBlockType.INPUT,
		blockId: ScheduleBlockId.DAY_MULTISELECT,
		optional: true,
		label: plainText(msg.setup.daysLabel),
		element: {
			type: BlockElementType.MULTI_STATIC_SELECT,
			appId,
			blockId: ScheduleBlockId.DAY_MULTISELECT,
			placeholder: plainText(msg.setup.daysPlaceholder),
			actionId: ScheduleActionId.DAY_MULTISELECT,
			initialValue: initialDays.map(String),
			options: DAY_OPTIONS.map((d) => ({
				text: plainText(d.text),
				value: d.value,
			})),
		},
	};

	const timeInputBlock: InputBlock = {
		type: LayoutBlockType.INPUT,
		blockId: ScheduleBlockId.TIME_INPUT,
		label: plainText(msg.setup.timeLabel),
		element: {
			type: BlockElementType.TIME_PICKER,
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
		title: plainText(msg.setup.title),
		blocks,
		submit: button({
			appId,
			blockId: ScheduleBlockId.SUBMIT_BTN,
			actionId: ScheduleActionId.SUBMIT,
			label: msg.setup.previewButton,
			style: 'primary',
		}) as ButtonElement,
		close: button({
			appId,
			blockId: ScheduleBlockId.CLOSE_BTN,
			actionId: ScheduleActionId.CLOSE,
			label: t.commonModalText.cancel,
			style: 'danger',
		}) as ButtonElement,
	};
}

function buildConfirmStageBlocks(
	appId: string,
	t: Translations,
	draft: ScheduleDraft,
	hadExisting: boolean,
	DAY_OPTIONS: Array<{ text: string; value: string }>,
	CADENCE_LABELS: Record<CadencePreset, string>,
): IUIKitModalViewParam {
	const msg = t.scheduleSetupModalText;
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
		type: LayoutBlockType.ACTIONS,
		blockId: ScheduleBlockId.BACK_BTN,
		elements: [
			button({
				appId,
				blockId: ScheduleBlockId.BACK_BTN,
				actionId: ScheduleActionId.BACK,
				label: msg.confirm.backButton,
			}),
		],
	};

	const summaryBlock: SectionBlock = section(
		msg.confirm.summary(
			CADENCE_LABELS[draft.preset],
			daysStr,
			formatTime12h(draft.reportTime),
			offsetLabel,
			nextRun,
			hadExisting,
		),
		{ blockId: ScheduleBlockId.CONFIRM_SUMMARY },
	);

	return {
		id: SCHEDULE_SETUP_MODAL_ID,
		title: plainText(msg.confirm.title),
		blocks: [backBlock, summaryBlock],
		submit: button({
			appId,
			blockId: ScheduleBlockId.CONFIRM_SUBMIT_BTN,
			actionId: ScheduleActionId.SUBMIT,
			label: msg.confirm.confirmButton,
			style: 'primary',
		}) as ButtonElement,
		close: button({
			appId,
			blockId: ScheduleBlockId.CLOSE_BTN,
			actionId: ScheduleActionId.CLOSE,
			label: t.commonModalText.cancel,
			style: 'danger',
		}) as ButtonElement,
	};
}

function buildDeleteConfirmBlocks(
	appId: string,
	t: Translations,
	existing: ScheduleRecord,
	DAY_OPTIONS: Array<{ text: string; value: string }>,
	CADENCE_LABELS: Record<CadencePreset, string>,
): IUIKitModalViewParam {
	const msg = t.scheduleSetupModalText;
	const daysStr = existing.days.length
		? existing.days.map((d) => DAY_OPTIONS[d].text).join(', ')
		: msg.everyDay;
	const offsetLabel = formatOffset(existing.utcOffsetMinutes);

	const backBlock: ActionsBlock = {
		type: LayoutBlockType.ACTIONS,
		blockId: ScheduleBlockId.BACK_BTN,
		elements: [
			button({
				appId,
				blockId: ScheduleBlockId.BACK_BTN,
				actionId: ScheduleActionId.BACK,
				label: msg.confirm.backButton,
			}),
		],
	};

	const summaryBlock: SectionBlock = section(
		msg.delete.summary(
			CADENCE_LABELS[existing.preset],
			daysStr,
			formatTime12h(existing.reportTime),
			offsetLabel,
		),
		{ blockId: ScheduleBlockId.DELETE_SUMMARY },
	);

	return {
		id: SCHEDULE_SETUP_MODAL_ID,
		title: plainText(msg.delete.title),
		blocks: [backBlock, summaryBlock],
		submit: button({
			appId,
			blockId: ScheduleBlockId.DELETE_SUBMIT_BTN,
			actionId: ScheduleActionId.SUBMIT,
			label: msg.delete.confirmButton,
			style: 'danger',
		}) as ButtonElement,
		close: button({
			appId,
			blockId: ScheduleBlockId.CLOSE_BTN,
			actionId: ScheduleActionId.CLOSE,
			label: t.commonModalText.cancel,
			style: 'primary',
		}) as ButtonElement,
	};
}

function describeExisting(
	record: ScheduleRecord,
	CADENCE_LABELS: Record<CadencePreset, string>,
): string {
	return `${CADENCE_LABELS[record.preset]} at ${formatTime12h(record.reportTime)}`;
}

export function parseScheduleSetupState(
	state: Record<string, Record<string, unknown>>,
	adminUserId: string,
	utcOffsetMinutes: number,
): ScheduleDraft | undefined {
	const presetRaw = getState(
		state,
		ScheduleBlockId.CADENCE_SELECT,
		ScheduleActionId.CADENCE_SELECT,
	);
	const preset = Object.values(CadencePreset).includes(
		presetRaw as CadencePreset,
	)
		? (presetRaw as CadencePreset)
		: CadencePreset.DAILY;

	const daysRaw = getState<string[]>(
		state,
		ScheduleBlockId.DAY_MULTISELECT,
		ScheduleActionId.DAY_MULTISELECT,
	);
	const timeRaw = getState(
		state,
		ScheduleBlockId.TIME_INPUT,
		ScheduleActionId.TIME_INPUT,
	);

	const reportTime = typeof timeRaw === 'string' ? timeRaw.trim() : '';
	if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(reportTime)) {
		return undefined;
	}

	let days: number[];
	if (preset === CadencePreset.CUSTOM) {
		const selected = Array.isArray(daysRaw) ? daysRaw : [];
		days = selected
			.map((v) => parseInt(v, 10))
			.filter((d) => d >= 0 && d <= 6);
	} else {
		days = CADENCE_PRESET_DAYS[preset];
	}

	return { adminUserId, preset, days, reportTime, utcOffsetMinutes };
}
