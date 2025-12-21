import type { Meta, StoryObj } from '@storybook/react';
import { AlertModal } from './AlertModal';
import { fn } from 'storybook/test';

/**
 * AlertModal Component Stories
 * 
 * A reusable modal component for displaying alert messages to users.
 * Supports different alert types (success, error, info) with appropriate styling.
 */
const meta = {
  title: 'Molecules/AlertModal',
  component: AlertModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A modal component for displaying alert messages to users.

**Features:**
- Three alert types: success, error, and info
- Customizable title or auto-generated based on type
- Click outside or OK button to close
- Accessible and keyboard-friendly

**Usage:**
Use this component to display important messages, confirmations, or errors to users.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'The message text to display',
    },
    type: {
      control: 'select',
      options: ['success', 'error', 'info'],
      description: 'Alert type determines styling and default title',
    },
    title: {
      control: 'text',
      description: 'Optional custom title (defaults based on type)',
    },
    onClose: {
      description: 'Function called when modal is closed',
    },
  },
} satisfies Meta<typeof AlertModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Success alert modal
 */
export const Success: Story = {
  args: {
    message: 'Operation completed successfully!',
    type: 'success',
    onClose: fn(),
  },
};

/**
 * Error alert modal
 */
export const Error: Story = {
  args: {
    message: 'An error occurred while processing your request. Please try again.',
    type: 'error',
    onClose: fn(),
  },
};

/**
 * Info alert modal
 */
export const Info: Story = {
  args: {
    message: 'This is an informational message for the user.',
    type: 'info',
    onClose: fn(),
  },
};

/**
 * Alert modal with custom title
 */
export const CustomTitle: Story = {
  args: {
    message: 'Your changes have been saved.',
    type: 'success',
    title: 'Saved!',
    onClose: fn(),
  },
};

/**
 * Long message alert
 */
export const LongMessage: Story = {
  args: {
    message: 'This is a longer message that demonstrates how the modal handles text that spans multiple lines. The modal will automatically wrap the text and adjust its height accordingly.',
    type: 'info',
    onClose: fn(),
  },
};
