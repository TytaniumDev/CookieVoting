import type { Meta, StoryObj } from '@storybook/react';
import { AuthButton } from './AuthButton';
import { BrowserRouter } from 'react-router-dom';
import { withFirebaseEmulator } from '../../.storybook/firebase-decorator';

/**
 * AuthButton Component Stories
 * 
 * A comprehensive authentication button component that handles Google sign-in/sign-out.
 */
const meta = {
  title: 'Molecules/AuthButton',
  component: AuthButton,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A comprehensive authentication button component.

**Features:**
- Google OAuth sign-in (popup or redirect fallback)
- User menu with avatar and email display
- Sign-out functionality
- Automatic redirect handling after OAuth redirect
- Error handling with user-friendly alerts
- Loading states during authentication

**Usage:**
This component is used in the Layout component header to provide authentication
throughout the application.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AuthButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default auth button (signed out state)
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Shows the "Sign in with Google" button when the user is not authenticated.
Clicking the button will attempt to sign in via Google OAuth.
        `,
      },
    },
  },
};

/**
 * Auth button with Firebase emulator
 * This story demonstrates the component working with Firebase Auth emulator
 */
export const WithFirebaseEmulator: Story = {
  decorators: [
    withFirebaseEmulator,
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
This story uses the Firebase Auth emulator for testing authentication.
Make sure to start the Firebase emulators before viewing this story:
\`npm run emulators:start\`

You can test sign-in/sign-out flows without affecting production data.
        `,
      },
    },
  },
};
