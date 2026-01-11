# Tech Stack - Cookie Voting 🍪

## Frontend
- **Framework:** [React 19](https://react.dev/) - For building a dynamic and responsive user interface.
- **Build Tool:** [Vite](https://vitejs.dev/) - Fast development environment and optimized production builds.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - For type safety and improved developer experience.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for rapid UI development.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) - Minimalist and scalable state management.

## Backend & Infrastructure
- **Platform:** [Firebase](https://firebase.google.com/)
  - **Authentication:** Firebase Auth - Secure user authentication for administrators.
  - **Database:** Firestore - Real-time NoSQL database for events, votes, and results.
  - **Storage:** Firebase Storage - Scalable cloud storage for cookie images.
  - **Cloud Functions:** Firebase Functions - Serverless backend logic for image processing and vote aggregation.
  - **Hosting:** Firebase Hosting - Global CDN for serving the frontend application.
- **CI/CD:** GitHub Actions - Automated testing and deployment workflows.

## AI & Image Processing
- **AI Detection:** [Google Gemini API](https://ai.google.dev/) - Vision models used for detecting cookies within images.
- **Fallback Detection:** Lightweight client-side blob detection algorithm for offline or fallback scenarios.

## Testing & Quality Assurance
- **Unit & Integration Testing:** [Vitest](https://vitest.dev/) - Fast Vite-native testing framework.
- **End-to-End Testing:** [Playwright](https://playwright.dev/) - Reliable browser automation for critical user flows.
- **Component Documentation:** [Storybook](https://storybook.js.org/) - For developing and documenting UI components in isolation.
