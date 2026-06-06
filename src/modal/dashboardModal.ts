import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import {
	IUIKitSurface,
	UIKitSurfaceType,
} from '@rocket.chat/apps-engine/definition/uikit/IUIKitSurface';
import { UserStatusStore } from '../persistence/userStatusStore';
import { SPAMMING_LEVEL_LABELS } from '../definition/spamlevel';
import { ModalId, DashboardActionId } from '../enums/modals/dashboardModal';
import { formatDuration } from '../lib/utils/messageUtils';
import { ModalActionId } from '../enums/modals/modals';

export async function buildDashboardModal(
	read: IRead,
	appId: string,
	searchValue?: string,
): Promise<IUIKitSurface> {
	const allRecords = await UserStatusStore.getAll(read);

	const records = searchValue
		? allRecords.filter((r) =>
				r.username.toLowerCase().includes(searchValue.toLowerCase()),
			)
		: allRecords;

	records.sort((a, b) => {
		if (b.spammingLevel !== a.spammingLevel)
			return b.spammingLevel - a.spammingLevel;
		return a.username.localeCompare(b.username);
	});

	const blocks: any[] = [];

	blocks.push({
		type: 'input',
		blockId: DashboardActionId.SEARCH_BLOCK_ID,
		optional: true,
		label: {
			type: 'plain_text',
			text: 'Search Users',
		},
		element: {
			type: 'plain_text_input',
			actionId: DashboardActionId.SEARCH_ACTION_ID,
			placeholder: {
				type: 'plain_text',
				text: 'Search by username...',
			},
			initialValue: searchValue || '',
			dispatchActionConfig: [ModalActionId.dispatchActionConfigOnInput],
		},
	});

	blocks.push({ type: 'divider' });

	blocks.push({
		type: 'section',
		text: {
			type: 'mrkdwn',
			text:
				records.length > 0
					? `*Flagged Users* — ${records.length} user(s) flagged`
					: searchValue
						? `*No users found* matching "${searchValue}"`
						: '*No flagged users.* All clear!',
		},
	});

	if (records.length > 0) {
		blocks.push({ type: 'divider' });
	}

	for (const rec of records) {
		const label =
			SPAMMING_LEVEL_LABELS[rec.spammingLevel] ??
			String(rec.spammingLevel);
		const cooldown =
			rec.cooldownUntil > 0 && Date.now() < rec.cooldownUntil
				? `${formatDuration(rec.cooldownUntil - Date.now())} remaining`
				: 'none';

		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text:
					`*@${rec.username}*\n` +
					`Level: *${label}* · Flags: ${rec.totalFlags} · Cooldown: ${cooldown}`,
			},
		});
		blocks.push({ type: 'divider' });
	}

	return {
		appId,
		id: ModalId.DASHBOARD,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: 'plain_text',
			text: 'Spam Monitor Dashboard',
		},
		blocks,
	};
}
