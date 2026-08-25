import {
	IPersistence,
	IPersistenceRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { Language } from '../definition/languagepreference';

const DEFAULT_LANGUAGE = Language.en;

export class LanguagePreferenceStorage {
	private readonly association: RocketChatAssociationRecord;

	constructor(
		private readonly persistence: IPersistence,
		private readonly persistenceRead: IPersistenceRead,
		private readonly userId: string,
	) {
		this.association = new RocketChatAssociationRecord(
			RocketChatAssociationModel.USER,
			`${this.userId}#language`,
		);
	}

	public async getLanguage(): Promise<Language> {
		const result = (await this.persistenceRead.readByAssociation(
			this.association,
		)) as Array<{ language: Language }>;

		return result.length > 0 ? result[0].language : DEFAULT_LANGUAGE;
	}

	public async setLanguage(language: Language): Promise<void> {
		await this.persistence.updateByAssociation(
			this.association,
			{ language },
			true,
		);
	}

	public async clearLanguage(): Promise<void> {
		await this.persistence.removeByAssociation(this.association);
	}
}
