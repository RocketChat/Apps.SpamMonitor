import {
	IPersistence,
	IPersistenceRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';

export class RoomInteractionStorage {
	constructor(
		private readonly persistence: IPersistence,
		private readonly persistenceRead: IPersistenceRead,
		private readonly userId: string,
	) {}

	public async storeInteractionRoomId(roomId: string): Promise<void> {
		const association = new RocketChatAssociationRecord(
			RocketChatAssociationModel.USER,
			`${this.userId}#RoomId`,
		);
		await this.persistence.updateByAssociation(
			association,
			{ roomId },
			true,
		);
	}

	public async getInteractionRoomId(): Promise<string> {
		const association = new RocketChatAssociationRecord(
			RocketChatAssociationModel.USER,
			`${this.userId}#RoomId`,
		);
		const [result] = (await this.persistenceRead.readByAssociation(
			association,
		)) as Array<{ roomId: string }>;
		return result?.roomId;
	}
}
