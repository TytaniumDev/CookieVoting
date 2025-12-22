import type { Meta, StoryObj } from '@storybook/react';
import { AuthButton } from './AuthButton';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../../lib/hooks/useAuth';
import React from 'react';

/**
 * Wrapper component that uses useAuth hook to provide props to AuthButton
 */
const AuthButtonWithAuth = () => {
  const { user, loading, signIn, signOut } = useAuth();
  return <AuthButton user={user} loading={loading} onSignIn={signIn} onSignOut={signOut} />;
};

/**
 * AuthButton Component Stories
 *
 * A comprehensive authentication button component that handles Google sign-in/sign-out.
 */
const meta = {
  title: 'Atoms/AuthButton',
  component: AuthButtonWithAuth,
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
 * Auth button with signed in user
 */
export const SignedIn: Story = {
  render: () => {
    // Mock user for storybook
    const mockUser = {
      uid: 'storybook-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      providerData: [],
      isAnonymous: false,
    } as React.ComponentProps<typeof AuthButton>['user'];

    return (
      <AuthButton
        user={mockUser}
        loading={false}
        onSignIn={async () => console.log('Sign in clicked')}
        onSignOut={async () => console.log('Sign out clicked')}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Shows the user menu with avatar and sign-out option when authenticated.
        `,
      },
    },
  },
};

/**
 * Auth button in loading state
 */
export const Loading: Story = {
  render: () => (
    <AuthButton
      user={null}
      loading={true}
      onSignIn={async () => console.log('Sign in clicked')}
      onSignOut={async () => console.log('Sign out clicked')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
Shows loading state while authentication is being initialized.
        `,
      },
    },
  },
};
