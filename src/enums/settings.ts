export enum AppSetting {
	MonitoringWindowDays = 'antispam_monitoring_window_days',
	SlidingWindowSeconds = 'antispam_sliding_window_seconds',
	CrossChannelThreshold = 'antispam_cross_channel_threshold',
	RateShortBurst = 'antispam_rate_short_burst',
	RateSustained = 'antispam_rate_sustained',
}

export const AppSettingDescription = {
	MonitoringWindowDays: 'antispam_setting_monitoring_window_days_description',
	SlidingWindowSeconds: 'antispam_setting_sliding_window_seconds_description',
	CrossChannelThreshold:
		'antispam_setting_cross_channel_threshold_description',
	RateShortBurst: 'antispam_setting_rate_short_burst_description',
	RateSustained: 'antispam_setting_rate_sustained_description',
};

export const AppSettingLabel = {
	MonitoringWindowDays: 'antispam_setting_monitoring_window_days_label',
	SlidingWindowSeconds: 'antispam_setting_sliding_window_seconds_label',
	CrossChannelThreshold: 'antispam_setting_cross_channel_threshold_label',
	RateShortBurst: 'antispam_setting_rate_short_burst_label',
	RateSustained: 'antispam_setting_rate_sustained_label',
};

export const AppSettingDefault = {
	MonitoringWindowDays: 42,
	SlidingWindowSeconds: 300,
	CrossChannelThreshold: 3,
	RateShortBurst: 5,
	RateSustained: 12,
};
