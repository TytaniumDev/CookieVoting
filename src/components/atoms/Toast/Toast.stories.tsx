import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';

const meta = {
  title: 'Atoms/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'success', 'error'],
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    message: 'This is an info toast message',
    type: 'info',
    duration: 3000,
  },
};

export const Success: Story = {
  args: {
    message: 'Operation completed successfully!',
    type: 'success',
    duration: 3000,
  },
};

export const Error: Story = {
  args: {
    message: 'Something went wrong. Please try again.',
    type: 'error',
    duration: 3000,
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'This is a very long message to test how the toast handles multiple lines of text or just long strings that might need truncation or wrapping.',
    type: 'info',
    duration: 5000,
  },
};
