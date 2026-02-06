<div align="center">

# Cookie Voting 🍪

[🚀 Launch App](https://cookie-voting.web.app/) • [📖 Documentation](#documentation) • [🐞 Report Bug](https://github.com/TytaniumDev/CookieVoting/issues)

</div>

<br>

> A modern web application for managing and voting on cookie competitions. Powered by AI cookie detection, Firebase, and React.

<!-- TODO: Add Hero Image (Screenshot of the dashboard) -->
<!-- <img src="./public/hero.png" alt="Cookie Voting Dashboard" width="100%" /> -->

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **Firebase CLI**

### Installation

**Option 1: Fast Track (Mac/Linux)**
```bash
./scripts/setup.sh
```

**Option 2: Manual Setup**
```bash
# Install dependencies
npm install && cd functions && npm install && cd ..

# Setup Environment
cp .env.example .env
# (Update .env with your Firebase credentials)
```

### Run
```bash
npm run dev
```

## ✨ Key Features

- 🤖 **AI-Powered Detection**: Automatically detects individual cookies in tray images using Google Gemini AI.
- 🗳️ **Interactive Voting**: Real-time voting system with multiple categories.
- 📊 **Live Results**: Instant tallying and leaderboard updates.
- 🛡️ **Admin Dashboard**: Comprehensive tools for event management and image tagging.
- 📱 **Responsive Design**: Seamless experience across desktop and mobile.

<a id="documentation"></a>

## 📚 Documentation

Detailed documentation is available for developers and contributors:

- **[Product Requirements (PRD)](./docs/PRD.md)**: Feature specs and user stories.
- **[Architecture & Tech Stack](#tech-stack)**: Overview of the system.
- **[Gemini AI Setup](./docs/GEMINI_SETUP.md)**: Configuring the vision API.
- **[Emulator Setup](./docs/EMULATOR_SETUP.md)**: Running Firebase locally.
- **[Testing Guide](./docs/TESTING_GUIDE.md)**: Strategy for Unit, E2E, and Visual tests.
- **[Storybook Library](https://tytaniumdev.github.io/CookieVoting/)**: Component documentation.
- **[Deployment](./.github/DEPLOYMENT_SETUP.md)**: CI/CD configuration.

<a id="tech-stack"></a>

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI**: Google Gemini API
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions

## 🤝 Contributing

Contributions are welcome! Please check out the [Issues](https://github.com/TytaniumDev/CookieVoting/issues) to get started.

## 📄 License

This project is private and proprietary.
