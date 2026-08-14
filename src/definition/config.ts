export const CONFIG_OVERVIEW_MODAL_ID = 'config-overview-modal';

export enum ConfigActionId {
	OPEN_ITEM_PREFIX = 'config_open_item::',
	CLOSE = 'config_close',
}

export enum ConfigBlockId {
	ITEM_ROW_PREFIX = 'config_item_row::',
	ITEM_BTN_PREFIX = 'config_item_btn::',
	CLOSE_BTN = 'config_close_btn',
}

export interface ConfigEntry {
	id: string;
	label: string;
	description: string;
}
export const CONFIG_ENTRIES: ConfigEntry[] = [
	{
		id: 'whitelist',
		label: 'Whitelist',
		description: 'Channels and roles fully excluded from spam monitoring.',
	},
];
