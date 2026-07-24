import { ManageUserActionId } from './modals/manageUsers';

export type LoggedUserAction =
	| ManageUserActionId.VOUCH
	| ManageUserActionId.RESET_COOLDOWN
	| ManageUserActionId.RESET_LEVEL_DOWN
	| ManageUserActionId.RESET_LEVEL_CLEAN;

export const LOGGED_ACTIONS: readonly string[] = [
	ManageUserActionId.VOUCH,
	ManageUserActionId.RESET_COOLDOWN,
	ManageUserActionId.RESET_LEVEL_DOWN,
	ManageUserActionId.RESET_LEVEL_CLEAN,
];
