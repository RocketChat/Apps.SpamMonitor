import { IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	ButtonElement,
	DividerBlock,
	LayoutBlockType,
	SectionBlock,
	TextObjectType,
} from '@rocket.chat/ui-kit';
export function plainText(text: string, emoji?: boolean) {
	return {
		type: TextObjectType.PLAIN_TEXT,
		text,
		...(emoji !== undefined ? { emoji } : {}),
	};
}
export function mrkdwn(text: string) {
	return {
		type: TextObjectType.MRKDWN,
		text,
	};
}

export function divider(blockId?: string): DividerBlock {
	return blockId
		? { type: LayoutBlockType.DIVIDER, blockId }
		: { type: LayoutBlockType.DIVIDER };
}

export function section(
	text: string,
	opts?: { blockId?: string; accessory?: SectionBlock['accessory'] },
): SectionBlock {
	return {
		type: 'section',
		...(opts?.blockId ? { blockId: opts.blockId } : {}),
		text: mrkdwn(text),
		...(opts?.accessory ? { accessory: opts.accessory } : {}),
	};
}

export interface ButtonOpts {
	appId: string;
	blockId: string;
	actionId: string;
	label: string;
	value?: string;
	style?: ButtonElement['style'];
	emoji?: boolean;
}

export function button(opts: ButtonOpts): ButtonElement {
	return {
		type: 'button',
		appId: opts.appId,
		blockId: opts.blockId,
		actionId: opts.actionId,
		text: plainText(opts.label, opts.emoji),
		...(opts.value !== undefined ? { value: opts.value } : {}),
		...(opts.style ? { style: opts.style } : {}),
	} as ButtonElement;
}

export function cancelButton(
	appId: string,
	blockId: string,
	actionId: string,
	cancelLabel: string,
	style?: ButtonElement['style'],
): ButtonElement {
	return button({ appId, blockId, actionId, label: cancelLabel, style });
}

export interface ModalShellOpts {
	id: string;
	title: string;
	titleEmoji?: boolean;
	blocks: IUIKitSurfaceViewParam['blocks'];
	submit?: ButtonElement;
	close?: ButtonElement;
}

export function modalShell(opts: ModalShellOpts): IUIKitSurfaceViewParam {
	return {
		id: opts.id,
		type: UIKitSurfaceType.MODAL,
		title: plainText(
			opts.title,
			opts.titleEmoji,
		) as IUIKitSurfaceViewParam['title'],
		blocks: opts.blocks,
		...(opts.submit ? { submit: opts.submit } : {}),
		...(opts.close ? { close: opts.close } : {}),
	} as IUIKitSurfaceViewParam;
}

export function getState<T = string>(
	state: Record<string, Record<string, unknown>> | undefined,
	blockId: string,
	actionId: string,
): T | undefined {
	return state?.[blockId]?.[actionId] as T | undefined;
}
