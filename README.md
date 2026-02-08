<div align="center">

# Cookie Voting 🍪

[🚀 Launch App](https://cookie-voting.web.app/) • [📖 Documentation](#documentation) • [🐞 Report Bug](https://github.com/TytaniumDev/CookieVoting/issues)

A modern, full-stack application for managing cookie competitions with AI-powered detection and real-time voting.

</div>

<br>

<div align="center">
  <img src="./public/hero.png" alt="Cookie Voting Dashboard" width="100%" />
</div>

<br>

## 🚀 Quick Start

Get up and running in minutes.

### Prerequisites

- **Node.js 20+**
- **Firebase CLI** (`npm install -g firebase-tools`)

### Installation & Run

```bash
# 1. Automatic Setup (Installs dependencies & environment)
./scripts/setup.sh

# 2. Start Development Server
npm run dev
```

> **Note:** The setup script configures the environment to use the **Firebase Emulator** by default (`VITE_USE_EMULATOR=true`), so you don't need production credentials to start coding.

## ✨ Key Features

- **🤖 AI-Powered Detection:** Automatically identifies individual cookies in tray images using Google Cloud Vision & Gemini.
- **🗳️ Interactive Voting:** Real-time voting system with dynamic categories and live leaderboards.
- **🛡️ Admin Dashboard:** Comprehensive tools for event management, image uploading, and candidate review.
- **📱 Responsive Design:** Seamless experience across all devices, from mobile phones to desktop screens.
- **🎨 Component Library:** Built with a documented Storybook design system.

<a id="documentation"></a>

## 📚 Documentation

Explore the detailed documentation for deeper insights:

### Core
- **[Product Requirements (PRD)](./docs/PRD.md):** Feature specifications and user stories.
- **[Architecture](./docs/PRD.md#technical-architecture):** System design and technical stack overview.
- **[Testing Guide](./docs/TESTING_GUIDE.md):** Strategy for Unit, E2E, and Visual tests.

### Guides
- **[Emulator Setup](./docs/EMULATOR_SETUP.md):** How to run and seed the local Firebase emulator.
- **[Gemini AI Setup](./docs/GEMINI_SCRIPT_SETUP.md):** Configuring the experimental AI detection scripts.
- **[Storybook Guide](./docs/STORYBOOK_SETUP.md):** Developing and testing UI components.
- **[Deployment](./.github/DEPLOYMENT_SETUP.md):** CI/CD pipeline and deployment instructions.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS
- **Backend:** Firebase (Auth, Firestore, Storage, Functions)
- **AI/ML:** Google Cloud Vision API, Google Gemini
- **Testing:** Vitest, Playwright

## 🤝 Contributing

Contributions are welcome! Please check out the [Issues](https://github.com/TytaniumDev/CookieVoting/issues) to get started.

## 📄 License

This project is private and proprietary.
