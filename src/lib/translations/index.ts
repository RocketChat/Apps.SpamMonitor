import { Translations } from '../../definition/languagepreference';
import * as en from './locals/en';
import * as pt from './locals/pt';
import * as du from './locals/du';
import * as fr from './locals/fr';
import * as ru from './locals/ru';
import * as sp from './locals/sp';
import * as tr from './locals/tr';
import * as zh from './locals/zh';

const registry: Record<string, Translations> = {
	en,
	pt,
	du,
	fr,
	ru,
	sp,
	tr,
	zh,
};

const DEFAULT_LANG = 'en';

export function getTranslations(lang: string | undefined | null): Translations {
	if (!lang) return registry[DEFAULT_LANG];
	return registry[lang] ?? registry[DEFAULT_LANG];
}
