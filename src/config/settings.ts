import {
	ISetting,
	SettingType,
} from '@rocket.chat/apps-engine/definition/settings';
import {
	AppSetting,
	AppSettingDefault,
	AppSettingDescription,
	AppSettingLabel,
} from '../enums/settings';

export const APP_SETTINGS: ISetting[] = [
	{
		id: AppSetting.MonitoringWindowDays,
		type: SettingType.NUMBER,
		packageValue: AppSettingDefault.MonitoringWindowDays,
		required: true,
		public: false,
		i18nLabel: AppSettingLabel.MonitoringWindowDays,
		i18nDescription: AppSettingDescription.MonitoringWindowDays,
	},
	{
		id: AppSetting.SlidingWindowSeconds,
		type: SettingType.NUMBER,
		packageValue: AppSettingDefault.SlidingWindowSeconds,
		required: true,
		public: false,
		i18nLabel: AppSettingLabel.SlidingWindowSeconds,
		i18nDescription: AppSettingDescription.SlidingWindowSeconds,
	},
	{
		id: AppSetting.CrossChannelThreshold,
		type: SettingType.NUMBER,
		packageValue: AppSettingDefault.CrossChannelThreshold,
		required: true,
		public: false,
		i18nLabel: AppSettingLabel.CrossChannelThreshold,
		i18nDescription: AppSettingDescription.CrossChannelThreshold,
	},
	{
		id: AppSetting.RateShortBurst,
		type: SettingType.NUMBER,
		packageValue: AppSettingDefault.RateShortBurst,
		required: true,
		public: false,
		i18nLabel: AppSettingLabel.RateShortBurst,
		i18nDescription: AppSettingDescription.RateShortBurst,
	},
	{
		id: AppSetting.RateSustained,
		type: SettingType.NUMBER,
		packageValue: AppSettingDefault.RateSustained,
		required: true,
		public: false,
		i18nLabel: AppSettingLabel.RateSustained,
		i18nDescription: AppSettingDescription.RateSustained,
	},
];
