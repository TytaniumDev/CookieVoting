<div align="center">

# Cookie Voting 🍪

[🚀 Launch App](https://cookie-voting.web.app/) • [📖 Documentation](#documentation) • [🐞 Report Bug](https://github.com/TytaniumDev/CookieVoting/issues)

Cookie Voting is a full-stack application designed to facilitate cookie competition events. Event administrators can upload images of cookies, and the system automatically detects individual cookies using Google Cloud Vision API. Voters can then vote on their favorite cookies in different categories, and results are tallied and displayed in real-time.
</div>

<br>

- **AI-Powered Cookie Detection**: Automatically detects cookies in images using Google Cloud Vision API
- **Interactive Voting System**: Users can vote on cookies across multiple categories
- **Real-time Results**: View voting results and statistics as votes are cast
- **Admin Dashboard**: Create and manage voting events, upload images, and tag cookies
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Component Documentation**: Comprehensive Storybook documentation for all UI components

> A modern web application for managing and voting on cookie competitions. Powered by AI cookie detection, Firebase, and React.

<!-- TODO: Add Hero Image (Screenshot of the dashboard) -->
<!-- <img src="./public/hero.png" alt="Cookie Voting Dashboard" width="100%" /> -->

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Firebase CLI (for deployment)
- Google Cloud Vision API enabled (for cookie detection)

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

- 🤖 **AI-Powered Detection**: Automatically detects individual cookies in tray images using **Google Cloud Vision API**.
- 🗳️ **Interactive Voting**: Real-time voting system with multiple categories.
- 📊 **Live Results**: Instant tallying and leaderboard updates.
- 🛡️ **Admin Dashboard**: Comprehensive tools for event management and image tagging.
- 📱 **Responsive Design**: Seamless experience across desktop and mobile.

<a id="documentation"></a>

## 📚 Documentation

Detailed documentation is available for developers and contributors:

- **[Product Requirements (PRD)](./docs/PRD.md)**: Feature specs and user stories.
- **[Technical Architecture](./docs/ARCHITECTURE_TECHNICAL.md)**: Deep dive into the stack and core workflows.
- **[Vision API Pipeline](./docs/VisionAPI.md)**: Details on the AI detection and cropping system.
- **[Emulator Setup](./docs/EMULATOR_SETUP.md)**: Running Firebase locally.
- **[Testing Guide](./docs/TESTING_GUIDE.md)**: Strategy for Unit, E2E, and Visual tests.
- **[Storybook Library](https://tytaniumdev.github.io/CookieVoting/)**: Component documentation.
- **[Deployment](./.github/DEPLOYMENT_SETUP.md)**: CI/CD configuration.
- **[Gemini Script Setup](./docs/GEMINI_SCRIPT_SETUP.md)**: (Experimental) Setup for the Gemini utility script.

<a id="tech-stack"></a>

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI Detection**: Google Cloud Vision API (Production), Google Gemini (Experimental Script)
- **UI Components**: Custom components with Storybook documentation
- **Testing**: Vitest, Playwright, Storybook
- **CI/CD**: GitHub Actions

## 🤝 Contributing

Contributions are welcome! Please check out the [Issues](https://github.com/TytaniumDev/CookieVoting/issues) to get started.

## 📄 License

This project is private and proprietary.
