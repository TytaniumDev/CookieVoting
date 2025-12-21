# Cookie Voting 🍪

A modern web application for managing and voting on cookie competitions. This application uses AI-powered cookie detection, Firebase for backend services, and React for the frontend.

## 🎯 Overview

Cookie Voting is a full-stack application designed to facilitate cookie competition events. Event administrators can upload images of cookies, and the system automatically detects individual cookies using Google's Gemini AI. Voters can then vote on their favorite cookies in different categories, and results are tallied and displayed in real-time.

### Key Features

- **AI-Powered Cookie Detection**: Automatically detects cookies in images using Google Gemini AI vision models
- **Interactive Voting System**: Users can vote on cookies across multiple categories
- **Real-time Results**: View voting results and statistics as votes are cast
- **Admin Dashboard**: Create and manage voting events, upload images, and tag cookies
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Component Documentation**: Comprehensive Storybook documentation for all UI components

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Firebase CLI (for deployment)
- Google Gemini API key (for cookie detection)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TytaniumDev/CookieVoting.git
   cd CookieVoting
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_USE_EMULATOR=true  # Set to false for production Firebase
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Or use the convenience script:
   ```bash
   cookies          # Production Firebase mode
   cookies -test    # Emulator mode for local testing
   ```

## 📚 Documentation

- **[Storybook Component Library](https://TytaniumDev.github.io/CookieVoting/storybook/)** - Browse and interact with all UI components
- [GEMINI_SETUP.md](./GEMINI_SETUP.md) - Setup guide for Gemini AI cookie detection
- [EMULATOR_SETUP.md](./EMULATOR_SETUP.md) - Local Firebase emulator setup
- [STORYBOOK_SETUP.md](./STORYBOOK_SETUP.md) - Storybook development guide
- [.github/DEPLOYMENT_SETUP.md](./.github/DEPLOYMENT_SETUP.md) - Deployment configuration

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI Detection**: Google Gemini API
- **UI Components**: Custom components with Storybook documentation
- **Testing**: Jest, Playwright, Vitest
- **CI/CD**: GitHub Actions

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run storybook` - Start Storybook development server
- `npm run emulators:start` - Start Firebase emulators

### Testing
- `npm test` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests with Playwright

### Building
- `npm run build` - Build for production
- `npm run build-storybook` - Build Storybook static site

### Deployment
- `npm run deploy` - Build and deploy to Firebase Hosting
- `npm run firebase:deploy:all` - Deploy everything (hosting, functions, rules)

## 🏗️ Project Structure

```
CookieVoting/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── lib/            # Utilities and Firebase config
│   └── styles/         # Global styles
├── functions/          # Firebase Cloud Functions
├── public/             # Static assets
├── tests/              # Test files
├── scripts/            # Utility scripts
└── .storybook/         # Storybook configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🔗 Links

- **Repository**: [https://github.com/TytaniumDev/CookieVoting](https://github.com/TytaniumDev/CookieVoting)
- **Storybook**: [https://TytaniumDev.github.io/CookieVoting/storybook/](https://TytaniumDev.github.io/CookieVoting/storybook/)
