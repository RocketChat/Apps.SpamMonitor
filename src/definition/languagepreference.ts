import * as en from '../lib/translations/locals/en';

export type Translations = typeof en;
export enum Language {
	en = 'en',
	pt = 'pt',
	du = 'du',
	fr = 'fr',
	ru = 'ru',
	sp = 'sp',
	tr = 'tr',
	zh = 'zh',
}
export const LANGUAGE_LABELS: Record<Language, string> = {
	[Language.en]: 'English',
	[Language.pt]: 'Português',
	[Language.du]: 'German',
	[Language.fr]: 'French',
	[Language.ru]: 'Russian',
	[Language.sp]: 'Spanish',
	[Language.tr]: 'Turkish',
	[Language.zh]: 'Chinese',
};
