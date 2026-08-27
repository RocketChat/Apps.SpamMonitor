import {
	IPersistence,
	IPersistenceRead,
	IUIKitSurfaceViewParam,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	BlockElementType,
	LayoutBlockType,
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
import {
	button,
	divider,
	getState,
	modalShell,
	section,
} from '../lib/utils/UiKitHandler';

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

	const headerBlock = section(t.languageModalText.header);

	return modalShell({
		id: LANGUAGE_SELECT_MODAL_ID,
		title: t.languageModalText.title,
		blocks: [
			headerBlock,
			divider(),
			{
				type: LayoutBlockType.INPUT,
				blockId: LanguageBlockId.LANGUAGE_SELECT,
				label: {
					type: TextObjectType.PLAIN_TEXT,
					text: t.languageModalText.selectLabel,
				},
				element: {
					type: BlockElementType.STATIC_SELECT,
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
		submit: button({
			appId,
			blockId: LanguageBlockId.LANGUAGE_SELECT,
			actionId: LanguageActionId.LANGUAGE_SELECT,
			label: t.commonModalText.submit,
		}),
		close: button({
			appId,
			blockId: LanguageBlockId.CLOSE_BTN,
			actionId: LanguageActionId.CLOSE,
			label: t.commonModalText.cancel,
		}),
	});
}

export function parseLanguageSelection(
	state: Record<string, Record<string, unknown>>,
): Language | undefined {
	const raw = getState<string>(
		state,
		LanguageBlockId.LANGUAGE_SELECT,
		LanguageActionId.LANGUAGE_SELECT,
	);
	return raw && isLanguage(raw) ? raw : undefined;
}

function isLanguage(value: string): value is Language {
	return Object.values(Language).includes(value as Language);
}
