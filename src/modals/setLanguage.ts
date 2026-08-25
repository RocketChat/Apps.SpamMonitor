import {
	IPersistence,
	IPersistenceRead,
	IUIKitSurfaceViewParam,
} from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	SectionBlock,
	StaticSelectElement,
	TextObjectType,
} from '@rocket.chat/ui-kit';
import {
	LANGUAGE_SELECT_MODAL_ID,
	LanguageActionId,
	LanguageBlockId,
} from '../enums/modals/language';
import { LanguagePreferenceStorage } from '../persistence/languagePreferenceStorage';
import {
	Language,
	LANGUAGE_LABELS,
	Translations,
} from '../definition/languagepreference';

export async function buildLanguageSelectModal(
	persistenceRead: IPersistenceRead,
	persistence: IPersistence,
	appId: string,
	userId: string,
	t: Translations,
): Promise<IUIKitSurfaceViewParam> {
	const store = new LanguagePreferenceStorage(
		persistence,
		persistenceRead,
		userId,
	);
	const currentLanguage = await store.getLanguage();

	const headerBlock: SectionBlock = {
		type: 'section',
		text: {
			type: TextObjectType.MRKDWN,
			text: t.languageModalText.header,
		},
	};

	return {
		id: LANGUAGE_SELECT_MODAL_ID,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: TextObjectType.PLAIN_TEXT,
			text: t.languageModalText.title,
		},
		submit: {
			type: 'button',
			appId,
			blockId: LanguageBlockId.LANGUAGE_SELECT,
			actionId: LanguageActionId.LANGUAGE_SELECT,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: t.commonModalText.submit,
			},
		},
		close: {
			type: 'button',
			appId,
			blockId: LanguageBlockId.CLOSE_BTN,
			actionId: LanguageActionId.CLOSE,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: t.commonModalText.cancel,
			},
		},
		blocks: [
			headerBlock,
			{ type: 'divider' },
			{
				type: 'input',
				blockId: LanguageBlockId.LANGUAGE_SELECT,
				label: {
					type: TextObjectType.PLAIN_TEXT,
					text: t.languageModalText.selectLabel,
				},
				element: {
					type: 'static_select',
					appId,
					blockId: LanguageBlockId.LANGUAGE_SELECT,
					actionId: LanguageActionId.LANGUAGE_SELECT,
					placeholder: {
						type: TextObjectType.PLAIN_TEXT,
						text: t.languageModalText.selectPlaceholder,
					},
					initialValue: currentLanguage,
					options: Object.values(Language).map((lang) => ({
						text: {
							type: TextObjectType.PLAIN_TEXT,
							text: LANGUAGE_LABELS[lang],
						},
						value: lang,
					})),
				} as StaticSelectElement,
			},
		],
	};
}

export function parseLanguageSelection(
	state: Record<string, Record<string, unknown>>,
): Language | undefined {
	const raw = state[LanguageBlockId.LANGUAGE_SELECT]?.[
		LanguageActionId.LANGUAGE_SELECT
	] as string | undefined;

	return raw && isLanguage(raw) ? raw : undefined;
}

function isLanguage(value: string): value is Language {
	return Object.values(Language).includes(value as Language);
}
