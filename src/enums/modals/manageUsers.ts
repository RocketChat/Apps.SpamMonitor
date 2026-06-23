export enum ManageUserActionId {
	VOUCH = 'manage_user_vouch',
	RESET_COOLDOWN = 'manage_user_reset_cooldown',
	RESET_LEVEL_DOWN = 'manage_user_reset_level_down',
	RESET_LEVEL_CLEAN = 'manage_user_reset_level_clean',
	CONFIRM_VOUCH = 'confirm_vouch',
	CONFIRM_RESET_COOLDOWN = 'confirm_reset_cooldown',
	CONFIRM_RESET_LEVEL_DOWN = 'confirm_reset_level_down',
	CONFIRM_RESET_LEVEL_CLEAN = 'confirm_reset_level_clean',
	OPEN_MANAGE_MODAL = 'list_open_manage_modal',
}

export const MANAGE_USER_MODAL_ID = 'manage_user_modal';
export const LIST_OVERFLOW_BLOCK_ID = 'spam_list_overflow';
export const CONFIRM_ACTION_MODAL_ID = 'confirm_action_modal';

// overflow-menu action ids that should open a confirmation modal.
export const ACTIONS_REQUIRING_CONFIRM = new Set<string>([
	ManageUserActionId.CONFIRM_VOUCH,
	ManageUserActionId.CONFIRM_RESET_COOLDOWN,
	ManageUserActionId.CONFIRM_RESET_LEVEL_DOWN,
	ManageUserActionId.CONFIRM_RESET_LEVEL_CLEAN,
]);

export const CONFIRM_TO_ACTION: Record<string, ManageUserActionId> = {
	[ManageUserActionId.CONFIRM_VOUCH]: ManageUserActionId.VOUCH,
	[ManageUserActionId.CONFIRM_RESET_COOLDOWN]:
		ManageUserActionId.RESET_COOLDOWN,
	[ManageUserActionId.CONFIRM_RESET_LEVEL_DOWN]:
		ManageUserActionId.RESET_LEVEL_DOWN,
	[ManageUserActionId.CONFIRM_RESET_LEVEL_CLEAN]:
		ManageUserActionId.RESET_LEVEL_CLEAN,
};

export const BlockId = {
	USER_INFO: 'manage_user_info',
	DETAILS: 'manage_user_details',
	DIVIDER: 'manage_user_divider',
	ACTIONS_HEADER: 'manage_user_actions_header',
	ACTIONS: 'manage_user_actions',
	CLOSE: 'manage_user_close',

	CONFIRM_TARGET: 'confirm_action_target',
	CONFIRM_SUBMIT: 'confirm_action_submit',
	CONFIRM_CLOSE: 'confirm_action_close',
} as const;
