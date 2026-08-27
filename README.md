![banner](https://res.cloudinary.com/dsdgpiinw/image/upload/v1787151435/gsoc_demo_day.jpg)

# Apps.SpamMonitor - Rocket.Chat App

A comprehensive anti-spam application for Rocket.Chat that automatically detects and flags spam from new users before it reaches your Rocket.Chat community.

## Installation

### Prerequisites

- Rocket.Chat Server (v8 or higher)
- Rocket.Chat Apps CLI (`@rocket.chat/apps-cli`)

### Setup

1. **Install the CLI** (if not already installed):
   ```sh
   npm install -g @rocket.chat/apps-cli
   ```
2. **Clone the repository**:
   ```sh
   git clone https://github.com/RocketChat/Apps.SpamMonitor
   cd Apps.SpamMonitor
   ```
3. **Install dependencies**:
   ```sh
   npm install
   ```
4. **Deploy the app**:
   ```sh
   rc-apps deploy --url <rocketchat_url> --username <username> --password <password>
   ```

## Contributing

Before contributing, please read [CONTRIBUTING.md](https://github.com/RocketChat/Apps.SpamMonitor/blob/main/CONTRIBUTING.md) to understand the project scope, and the do's and don'ts for contributions.

### Before opening a PR

1. **Open an issue first**, using the appropriate prefix in the title so it's easy to triage:
   - `[feat]` — for a new feature
   - `[bug]` — for a bug report
   - `[refactor]` — for refactoring work

2. **Lint your code**:
   ```sh
   npm run lint
   ```

3. **Format your code with Prettier**:
   ```sh
   npx prettier --config .prettierrc '**.ts' --write
   ```

Only once the issue is created and your changes are linted and formatted should you open the pull request.

## Documentation

Here are some links to examples and documentation:

- [Rocket.Chat Apps TypeScript Definitions Documentation](https://rocketchat.github.io/Rocket.Chat.Apps-engine/)
- [Rocket.Chat Apps TypeScript Definitions Repository](https://github.com/RocketChat/Rocket.Chat.Apps-engine)
- [Example Rocket.Chat Apps](https://github.com/graywolf336/RocketChatApps)
- Community Forums
  - [App Requests](https://forums.rocket.chat/c/rocket-chat-apps/requests)
  - [App Guides](https://forums.rocket.chat/c/rocket-chat-apps/guides)
  - [Top View of Both Categories](https://forums.rocket.chat/c/rocket-chat-apps)
- [#rocketchat-apps on Open.Rocket.Chat](https://open.rocket.chat/channel/rocketchat-apps)
