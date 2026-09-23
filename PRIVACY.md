# Privacy Policy: Apps.SpamMonitor

**Last updated:** September 8, 2026

## 1. Overview

Apps.SpamMonitor ("the App") is a [Rocket.Chat App](https://developer.rocket.chat/) that installs directly into your own Rocket.Chat workspace. It is **not** a separately hosted service, it runs inside your Rocket.Chat instance, using Rocket.Chat's own App persistence layer (the same database backing your workspace).

The App's developer(s) do not operate any external server for this App, do not receive a copy of your data, and cannot access your workspace's data. Everything described below happens **on your own instance**.

## 2. What data the App processes

To detect and act on spam, the App reads and stores the following, entirely within your Rocket.Chat instance:

- **Message content and metadata** it inspects to detect spam patterns (exact/fuzzy duplicates, rate flooding, cross-channel posting, link spam), sender, channel, timestamp, and message text.
- **User spam-status data**, flag counts, escalation level, and history, used to decide restrictions (timeouts, notifications).
- **Admin configuration** you set, spam-level actions and thresholds, whitelisted channels/roles, custom notification messages, and scheduled report settings.

The App does not collect data beyond what it needs to evaluate and report on spam activity in the workspace where it's installed. The App does not use any AI or external model to process this data.

## 3. Where data is stored and who can access it

All data above is stored using Rocket.Chat's App persistence API, inside your workspace's own database. It is subject to the same access controls, backup policies, and hosting arrangement (self-managed or Rocket.Chat Cloud) that already govern the rest of your Rocket.Chat instance. Only your workspace administrators have access to it through the App's admin UI (dashboards, scheduled reports).

## 4. Third-party sharing

The App does not send data to any third party or external API. If this changes in a future version, this policy will be updated before that release to describe what is shared and with whom.

## 5. Data retention and deletion

Spam-monitoring data is retained according to the App's configurable monitoring window and your own retention settings. Uninstalling the App removes the private admin channel and stops further processing; underlying data lifecycle otherwise follows your workspace's standard data retention and deletion practices, since it lives in your own database.

## 6. Your control

As the workspace administrator, you control:
- Whether the App is installed or enabled at all
- What it monitors (thresholds, whitelists, levels)
- Whether scheduled reports are generated and to whom
- When to uninstall it, which stops all processing

## 7. Open source

Apps.SpamMonitor's source code is public and open for inspection at:
**https://github.com/RocketChat/Apps.SpamMonitor**

If you have questions about how a specific feature handles data, the implementation is the ground truth, feel free to open an issue.

## 8. Changes to this policy

Material changes will be reflected in this file's commit history in the repository above. Continued use of the App after an update constitutes acceptance of the revised policy.

## 9. Contact

Questions about this policy: open an issue at https://github.com/RocketChat/Apps.SpamMonitor/issues
