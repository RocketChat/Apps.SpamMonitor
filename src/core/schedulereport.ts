import {
	IRead,
	IModify,
	IHttp,
	IPersistence,
} from '@rocket.chat/apps-engine/definition/accessors';
import { UserStatusStore } from '../persistence/userStatusStore';
import { SpammingLevel, SPAMMING_LEVEL_LABELS } from '../definition/spamlevel';
import { ScheduleStore } from '../persistence/scheduleReports/scheduleStore';
import { FlagLogStore } from '../persistence/scheduleReports/flagLogStore';
import { AdminActionLogStore } from '../persistence/scheduleReports/adminActionLogStore';
import { ManageUserActionId } from '../enums/modals/manageUsers';
import { LEVEL_ACTION_LABELS } from '../definition/levelConfig';
import { dailyReportNotification } from '../lib/translations/locals/en';
import { MAX_ROOMS_PER_SUMMARY } from '../constants/scheduleLogStore';

export const DAILY_REPORT_JOB_ID = 'anti-spam-daily-report';

function actionLabel(action: ManageUserActionId): string {
	return LEVEL_ACTION_LABELS[action] ?? action;
}
export class ScheduledReporter {
	public static async sendDailyReport(
		read: IRead,
		modify: IModify,
		_http: IHttp,
		persis: IPersistence,
		adminChannelName: string,
	): Promise<void> {
		const room = await read.getRoomReader().getByName(adminChannelName);
		if (!room) return;
		const appUser = await read.getUserReader().getAppUser();
		if (!appUser) return;

		const scheduleRecord = await ScheduleStore.get(read);
		const since =
			scheduleRecord?.lastReportSentAt ??
			Date.now() - 24 * 60 * 60 * 1000;

		const summaries = await FlagLogStore.getDailySummariesSince(
			read,
			since,
		);
		const adminActions = await AdminActionLogStore.getActionsSince(
			read,
			since,
		);
		const allUsers = await UserStatusStore.getAll(read);
		const flaggedUsers = allUsers.filter(
			(u) => u.spammingLevel > SpammingLevel.Clean,
		);
		const totalFlags = summaries.reduce((sum, s) => sum + s.flagCount, 0);

		const dateStr = new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});

		const reportLines: string[] = [
			dailyReportNotification.title(dateStr),
			'',
		];

		if (
			totalFlags === 0 &&
			flaggedUsers.length === 0 &&
			adminActions.length === 0
		) {
			reportLines.push(
				dailyReportNotification.allClear.heading,
				'',
				dailyReportNotification.allClear.flagsLine,
				dailyReportNotification.allClear.flaggedUsersLine,
				dailyReportNotification.allClear.trackedUsersLine(
					allUsers.length,
				),
			);
		} else {
			reportLines.push(
				dailyReportNotification.summary.heading,
				dailyReportNotification.summary.flagsLine(totalFlags),
				dailyReportNotification.summary.flaggedUsersLine(
					flaggedUsers.length,
				),
				dailyReportNotification.summary.adminActionsLine(
					adminActions.length,
				),
				dailyReportNotification.summary.trackedUsersLine(
					allUsers.length,
				),
				'',
			);
			for (
				let level = SpammingLevel.Monitored;
				level <= SpammingLevel.AdminReview;
				level++
			) {
				const atLevel = flaggedUsers.filter(
					(u) => u.spammingLevel === level,
				);
				if (!atLevel.length) continue;
				reportLines.push(
					dailyReportNotification.levelGroup.heading(
						SPAMMING_LEVEL_LABELS[level],
						atLevel.length,
					),
				);
				for (const u of atLevel) {
					reportLines.push(
						dailyReportNotification.levelGroup.userLine(
							u.username,
							u.totalFlags ?? '?',
						),
					);
				}
				reportLines.push('');
			}
			if (summaries.length) {
				reportLines.push(dailyReportNotification.flaggedUsers.heading);

				const topSummaries = summaries.slice(0, 15);
				const currentStatuses = await Promise.all(
					topSummaries.map((s) =>
						UserStatusStore.get(read, s.userId),
					),
				);

				for (let i = 0; i < topSummaries.length; i++) {
					const s = topSummaries[i];
					const current = currentStatuses[i];

					const triggerList = Object.entries(s.triggers)
						.map(([k, v]) => `${k}:${v}`)
						.join(', ');
					const currentLabel =
						current && current.spammingLevel > SpammingLevel.Clean
							? SPAMMING_LEVEL_LABELS[current.spammingLevel]
							: 'Clean';

					reportLines.push(
						dailyReportNotification.flaggedUsers.userLine(
							s.username,
							s.flagCount,
							triggerList,
							currentLabel,
						),
					);

					if (s.rooms.length) {
						const roomsList = s.rooms.join(', ');
						reportLines.push(
							s.rooms.length >= MAX_ROOMS_PER_SUMMARY
								? dailyReportNotification.flaggedUsers.roomsTruncated(
										roomsList,
									)
								: dailyReportNotification.flaggedUsers.rooms(
										roomsList,
									),
						);
					}
				}

				if (summaries.length > 15)
					reportLines.push(
						dailyReportNotification.moreCount(
							summaries.length - 15,
						),
					);
				reportLines.push('');
			}
			if (adminActions.length) {
				reportLines.push(dailyReportNotification.adminActions.heading);
				for (const a of adminActions.slice(0, 15)) {
					reportLines.push(
						dailyReportNotification.adminActions.actionLine(
							a.username,
							actionLabel(a.action),
							a.adminUsername,
						),
					);
				}
				if (adminActions.length > 15)
					reportLines.push(
						dailyReportNotification.moreCount(
							adminActions.length - 15,
						),
					);
			}
		}

		const msg = modify
			.getCreator()
			.startMessage()
			.setSender(appUser)
			.setRoom(room)
			.setText(reportLines.join('\n'));
		await modify.getCreator().finish(msg);

		await ScheduleStore.markSent(read, persis, Date.now());
	}
}
