<div align="center">

# Cookie Voting 🍪

[![Launch App](https://img.shields.io/badge/🚀_Launch_App-Visit-blue?style=for-the-badge)](https://cookie-voting.web.app/)
[![Documentation](https://img.shields.io/badge/📖_Documentation-Read-green?style=for-the-badge)](#documentation)
[![Report Bug](https://img.shields.io/badge/🐞_Report_Bug-GitHub-red?style=for-the-badge)](https://github.com/TytaniumDev/CookieVoting/issues)

Cookie Voting is a full-stack application designed to facilitate cookie competition events. Event administrators can upload images of cookies, and the system automatically detects individual cookies using Google Cloud Vision API. Voters can then vote on their favorite cookies in different categories, and results are tallied and displayed in real-time.
</div>

<br>

![Cookie Voting Dashboard](public/hero.png)

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **Firebase CLI**

### Run

```bash
# 1. Setup (Install dependencies & environment)
./scripts/setup.sh

# 2. Run locally
npm run dev
```

## ✨ Key Features

- 🤖 **AI-Powered Detection**: Automatically detects individual cookies in tray images using Google Cloud Vision API.
- 🗳️ **Interactive Voting**: Real-time voting system with multiple categories.
- 📊 **Live Results**: Instant tallying and leaderboard updates.
- 🛡️ **Admin Dashboard**: Comprehensive tools for event management and image tagging.
- 📱 **Responsive Design**: Seamless experience across desktop and mobile.

<a id="documentation"></a>

## 📚 Documentation

Detailed documentation for developers:

- **[Product Requirements (PRD)](./docs/PRD.md)**: Feature specs and user stories.
- **[Architecture & Tech Stack](#tech-stack)**: System overview.
- **[Testing Guide](./docs/TESTING_GUIDE.md)**: Strategy for Unit, E2E, and Visual tests.
- **[Storybook Library](https://tytaniumdev.github.io/CookieVoting/)**: Component documentation.
- **[Gemini Script Setup](./docs/GEMINI_SCRIPT_SETUP.md)**: Experimental AI detection.
- **[Emulator Setup](./docs/EMULATOR_SETUP.md)**: Running Firebase locally.
- **[Deployment Guide](./.github/DEPLOYMENT_SETUP.md)**: CI/CD configuration.

<a id="tech-stack"></a>

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI Detection**: Google Cloud Vision API
- **Testing**: Vitest, Playwright, Storybook
- **CI/CD**: GitHub Actions

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to get started.

## 📄 License

This project is private and proprietary.
