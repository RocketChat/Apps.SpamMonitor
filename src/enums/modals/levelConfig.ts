export const LEVEL_OVERVIEW_MODAL_ID = 'level_config_overview_modal';
export const EDIT_LEVEL_MODAL_ID = 'edit_level_modal';

export const OverviewBlockId = {
	LEVEL_ROW_PREFIX: 'overview_level_row_',
	EDIT_BTN_PREFIX: 'overview_edit_btn_',
	CLOSE_BTN: 'overview_close_btn',
} as const;

export const OverviewActionId = {
	EDIT_LEVEL_PREFIX: 'overview_edit_level_',
	CLOSE: 'overview_close_action',
} as const;

export const EditLevelBlockId = {
	ACTION_SELECT: 'edit_block_action',
	TIMEOUT_INPUT: 'edit_block_timeout',
	MESSAGE_INPUT: 'edit_block_message',
	SUBMIT_BTN: 'edit_submit_btn',
	CLOSE_BTN: 'edit_close_btn',
	ACTION_BUTTONS: 'edit_level_action_buttons',
} as const;

export const EditLevelActionId = {
	ACTION_SELECT: 'edit_action_select',
	TIMEOUT_INPUT: 'edit_timeout_input',
	MESSAGE_INPUT: 'edit_message_input',
	SUBMIT: 'edit_submit_action',
	CLOSE: 'edit_close_action',
	RESET_TO_DEFAULT: 'edit_level_reset_default',
	BACK_TO_OVERVIEW: 'edit_level_back_overview',
} as const;
