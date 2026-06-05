export interface CachedMessage {
	hash: string;
	messageId?: string;
	roomId: string;
	timestamp: number;
	normalized: string;
	hasUrl: boolean;
	domains: string[];
}
