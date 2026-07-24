export const SCHEDULE_SETUP_MODAL_ID = 'schedule_setup_modal';

export enum ScheduleBlockId {
	CADENCE_SELECT = 'schedule_cadence_select',
	HEADER = 'schedule_header',
	DIVIDER = 'schedule_divider',
	DAY_MULTISELECT = 'schedule_day_multiselect',
	TIME_INPUT = 'schedule_time_input',
	SUBMIT_BTN = 'schedule_submit_btn',
	BACK_BTN = 'schedule_back_btn',
	CLOSE_BTN = 'schedule_close_btn',
	CONFIRM_SUMMARY = 'schedule_confirm_summary',
	CONFIRM_SUBMIT_BTN = 'schedule_confirm_submit_btn',
	CADENCE_HINT = 'schedule_cadence_hint',
	DELETE_BTN = 'schedule_delete_btn',
	DELETE_SUMMARY = 'schedule_delete_summary',
	DELETE_SUBMIT_BTN = 'schedule_delete_submit_btn',
}

export enum ScheduleActionId {
	CADENCE_SELECT = 'schedule_cadence_select_action',
	DAY_MULTISELECT = 'schedule_day_multiselect_action',
	TIME_INPUT = 'schedule_time_input_action',
	DELETE = 'schedule_delete_action',
	BACK = 'schedule_back_action',
	SUBMIT = 'schedule_submit_action',
	CLOSE = 'schedule_close_action',
}

export enum CadencePreset {
	DAILY = 'daily',
	WEEKDAYS = 'weekdays',
	WEEKLY = 'weekly',
	CUSTOM = 'custom',
}

export const CADENCE_PRESET_DAYS: Record<CadencePreset, number[]> = {
	[CadencePreset.DAILY]: [],
	[CadencePreset.WEEKDAYS]: [1, 2, 3, 4, 5],
	[CadencePreset.WEEKLY]: [1],
	[CadencePreset.CUSTOM]: [],
};
