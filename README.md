<p align="center">
  <img src="./icon.png" alt="Apps.SpamMonitor icon" width="120" />
</p>

# Apps.SpamMonitor - Rocket.Chat App

A comprehensive anti-spam application for Rocket.Chat that automatically detects and flags spam from new users before it reaches your Rocket.Chat community.

Automatically detects and flags spam from new users before it reaches Rocket.Chat's community

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

## Project Timeline

- [x] Initialise the repo
- [x] Add gate system with basic command usage of list users flagged and user flags
- [x] Add cache system
- [x] Add levels system with customise option and command
- [x] Add admin level commands with UI
- [x] Add admin functionalities (vouch, status, reset level)
- [ ] Add report option to see reports when scheduled
- [ ] Add AI admin commands

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
