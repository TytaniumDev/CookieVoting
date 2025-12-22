# Storybook Setup Documentation

This document describes the Storybook implementation for the Cookie Voting application.

## Overview

Storybook has been successfully integrated into the project to help document, test, and develop UI components in isolation. This improves component reusability, ensures UI consistency, and provides comprehensive documentation.

## Installation

Storybook was installed using:

```bash
npx storybook@latest init
```

This automatically configured Storybook for React + TypeScript + Vite.

## Component Organization

Components are organized using **Atomic Design** principles:

### Molecules

- **AlertModal**: Modal component for displaying alert messages
- **AuthButton**: Authentication button with Google OAuth

### Organisms

- **ImageWithDetections**: Image viewer with cookie detection overlays (primary focus)
- **ImageTagger**: Comprehensive image tagging interface
- **CookieViewer**: Interactive image viewer with zoom and pan

### Templates

- **Layout**: Main application layout wrapper

## Firebase Emulator Integration

Many components integrate with Firebase services. To use Firebase emulators in Storybook:

1. **Start Firebase Emulators:**

   ```bash
   npm run emulators:start
   ```

2. **Set Environment Variable:**
   Create a `.env` file with:

   ```
   VITE_USE_EMULATOR=true
   ```

3. **Run Storybook:**
   ```bash
   npm run storybook
   ```

Stories that use Firebase emulators are marked with the `WithFirebaseEmulator` decorator. These stories will automatically connect to the emulators when they're running.

## Available Stories

### ImageWithDetections (Primary Component)

- **Default**: Multiple detected cookies with polygons
- **NoDetections**: Empty state
- **BoundingBoxesOnly**: Fallback to bounding boxes
- **WithBorders**: Visible borders on overlays
- **WithCustomOverlays**: Custom rendering at different positions
- **ManyDetections**: Stress test with many cookies
- **WithFirebaseEmulator**: Integration with Firebase Storage emulator
- **DifferentImage**: Different test image

### ImageTagger

- **Default**: Empty tagging interface
- **WithExistingCookies**: Editing existing tags
- **WithFirebaseEmulator**: Full Firebase integration
- **DifferentImage**: Different test image

### CookieViewer

- **Default**: Sample cookies
- **WithSelection**: Selected cookie highlighted
- **ManyCookies**: Many cookies displayed
- **NoCookies**: Empty state

### AlertModal

- **Success**: Success message
- **Error**: Error message
- **Info**: Info message
- **CustomTitle**: Custom title
- **LongMessage**: Long message handling

### AuthButton

- **Default**: Sign-in button
- **WithFirebaseEmulator**: Firebase Auth emulator integration

### Layout

- **Default**: Standard layout
- **LandingPage**: Landing page (no header/footer)

## Component Documentation

All components now have comprehensive JSDoc comments that:

- Explain the component's purpose
- Document all props with types and descriptions
- Provide usage examples
- Describe features and behavior

These comments are automatically used by Storybook to generate documentation.

## CI/CD Integration

Storybook is automatically built and deployed as part of the GitHub Actions workflow:

1. **Build Step**: Storybook is built during the `build` job
2. **Artifact Upload**: Built Storybook is uploaded as an artifact
3. **Deployment**: Storybook is deployed to GitHub Pages on pushes to main branch

The Storybook will be available at:
`https://[your-username].github.io/[repo-name]/storybook/`

## Running Storybook Locally

```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## Best Practices Implemented

1. **Atomic Design**: Components organized by complexity
2. **Comprehensive Documentation**: JSDoc comments on all components
3. **Multiple States**: Stories cover default, empty, error, and edge cases
4. **Firebase Integration**: Emulator support for testing with real Firebase services
5. **Accessibility**: a11y addon configured for accessibility testing
6. **Interactive Controls**: All props are controllable via Storybook controls
7. **Action Logging**: User interactions are logged via actions addon

## File Structure

```
.storybook/
  ├── main.ts              # Storybook configuration
  ├── preview.ts            # Global preview settings
  ├── firebase-decorator.tsx # Firebase emulator decorator
  └── README.md            # Storybook documentation

src/components/
  ├── ImageWithDetections.tsx
  ├── ImageWithDetections.stories.tsx
  ├── ImageTagger.tsx
  ├── ImageTagger.stories.tsx
  ├── CookieViewer.tsx
  ├── CookieViewer.stories.tsx
  ├── AlertModal.tsx
  ├── AlertModal.stories.tsx
  ├── AuthButton.tsx
  ├── AuthButton.stories.tsx
  └── layout/
      ├── Layout.tsx
      └── Layout.stories.tsx
```

## Next Steps

1. **Add More Stories**: Continue adding stories for edge cases and variations
2. **Visual Regression Testing**: Consider adding Chromatic for visual regression testing
3. **Component Testing**: Use Storybook's testing capabilities for automated component tests
4. **Design Tokens**: Consider adding design tokens for consistent theming
5. **Accessibility Audits**: Use the a11y addon to audit all components

## Troubleshooting

### Firebase Emulators Not Connecting

- Ensure emulators are running: `npm run emulators:start`
- Check that `VITE_USE_EMULATOR=true` is set in `.env`
- Verify emulator ports match Firebase configuration

### Storybook Build Fails

- Check for TypeScript errors: `npm run build`
- Ensure all dependencies are installed: `npm ci`
- Check Storybook logs for specific errors

### Components Not Rendering

- Verify component imports are correct
- Check that CSS modules are properly configured
- Ensure React Router is set up for components that use it

## Resources

- [Storybook Documentation](https://storybook.js.org/)
- [Atomic Design Principles](https://bradfrost.com/blog/post/atomic-web-design/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
