<div align="center">

# Cookie Voting 🍪

[🚀 Launch App](https://cookie-voting.web.app/) • [📖 Documentation](#documentation) • [🐞 Report Bug](https://github.com/TytaniumDev/CookieVoting/issues)

Cookie Voting is a full-stack application for managing and voting on cookie competitions. Powered by AI detection, Firebase, and React.
</div>

<br>

<img src="./public/hero.png" alt="Cookie Voting Dashboard" width="100%" />

## 🚀 Quick Start

### Prerequisites

-   **Node.js 20+**
-   **Firebase CLI**

### Installation

```bash
# 1. Setup Environment
./scripts/setup.sh

# 2. Run Local Development Server
npm run dev
```

## ✨ Key Features

-   🤖 **AI-Powered Detection**: Automatically detects individual cookies in tray images using Google Cloud Vision API.
-   🗳️ **Interactive Voting**: Real-time voting system with multiple categories.
-   📊 **Live Results**: Instant tallying and leaderboard updates.
-   🛡️ **Admin Dashboard**: Comprehensive tools for event management and image tagging.
-   📱 **Responsive Design**: Seamless experience across desktop and mobile.

<a id="documentation"></a>

## 📚 Documentation

Detailed documentation is available for developers and contributors:

-   **[Product Requirements (PRD)](./docs/PRD.md)**: Feature specs and user stories.
-   **[Gemini AI Setup](./docs/GEMINI_SCRIPT_SETUP.md)**: Configuring the experimental vision script.
-   **[Emulator Setup](./docs/EMULATOR_SETUP.md)**: Running Firebase locally.
-   **[Testing Guide](./docs/TESTING_GUIDE.md)**: Strategy for Unit, E2E, and Visual tests.
-   **[Storybook Library](https://tytaniumdev.github.io/CookieVoting/)**: Component documentation.
-   **[Deployment](./.github/DEPLOYMENT_SETUP.md)**: CI/CD configuration.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite, TailwindCSS
-   **Backend**: Firebase (Auth, Firestore, Storage, Functions)
-   **AI Detection**: Google Cloud Vision API & Google Gemini (Experimental)
-   **Testing**: Vitest, Playwright, Storybook
-   **CI/CD**: GitHub Actions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) to get started.

## 📄 License

This project is private and proprietary.
