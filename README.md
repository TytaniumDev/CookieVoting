<div align="center">

# Cookie Voting 🍪

[![Launch App](https://img.shields.io/badge/🚀_Launch-App-blue?style=for-the-badge)](https://cookie-voting.web.app/)
[![Documentation](https://img.shields.io/badge/📖_Documentation-read-green?style=for-the-badge)](#documentation)
[![Report Bug](https://img.shields.io/badge/🐞_Report_Bug-red?style=for-the-badge)](https://github.com/TytaniumDev/CookieVoting/issues)

<br>

**The AI-powered platform for hosting competitive cookie tasting events.**

<br>

![AI Detection in Action](./public/test-cookies.jpg)
*AI Detection in Action (Placeholder - Real Screenshot Needed)*

</div>

## 🚀 Quick Start

Get up and running in minutes.

```bash
# 1. Clone the repository
git clone https://github.com/TytaniumDev/CookieVoting.git
cd CookieVoting

# 2. Run the setup script (handles dependencies & environment)
./scripts/setup.sh

# 3. Start development server
npm run dev
```

## ✨ Key Features

- 🤖 **AI-Powered Detection**: Automatically identifies individual cookies from tray photos using Google Cloud Vision API.
- 🗳️ **Interactive Voting**: Real-time voting system with live updates and multiple categories.
- 📊 **Instant Results**: View voting statistics and leaderboards as they happen.
- 🛡️ **Admin Dashboard**: Comprehensive tools for event management and image processing.
- 📱 **Responsive Design**: Seamless experience across desktop and mobile devices.

<a id="documentation"></a>

## 📚 Documentation Map

Everything you need to know about the project structure and architecture.

| Topic | Document | Description |
| :--- | :--- | :--- |
| **Product** | [Product Requirements (PRD)](./docs/PRD.md) | Feature specs and user stories. |
| **Testing** | [Testing Guide](./docs/TESTING_GUIDE.md) | Strategy for Unit, E2E, and Visual tests. |
| **AI Setup** | [Gemini Setup](./docs/GEMINI_SCRIPT_SETUP.md) | Configuration for the experimental AI script. |
| **Emulator** | [Emulator Setup](./docs/EMULATOR_SETUP.md) | How to run Firebase locally. |
| **Components** | [Storybook Library](https://tytaniumdev.github.io/CookieVoting/) | UI component documentation. |
| **Deployment** | [Deployment Guide](./.github/DEPLOYMENT_SETUP.md) | CI/CD and production deployment. |

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI**: Google Cloud Vision API (Production), Google Gemini (Experimental)
- **Testing**: Vitest, Playwright, Storybook

## 🤝 Contributing

Contributions are welcome! Please check out the [Issues](https://github.com/TytaniumDev/CookieVoting/issues) to get started.

## 📄 License

This project is private and proprietary.
