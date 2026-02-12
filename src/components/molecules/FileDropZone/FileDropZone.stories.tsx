import type { Meta, StoryObj } from '@storybook/react';
import { FileDropZone } from './FileDropZone';

const meta: Meta<typeof FileDropZone> = {
  title: 'Molecules/FileDropZone',
  component: FileDropZone,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onFileSelect: { action: 'file selected' },
  },
};

export default meta;
type Story = StoryObj<typeof FileDropZone>;

export const Default: Story = {
  args: {
    accept: 'image/*',
    icon: '📷',
    text: 'Click or drag an image here',
  },
};

export const WithHint: Story = {
  args: {
    accept: 'image/*',
    icon: '🖼️',
    text: 'Drop your cookie photo',
    hint: 'Supports JPG, PNG, WebP',
  },
};

export const CustomIcon: Story = {
  args: {
    accept: '.pdf,.doc,.docx',
    icon: '📄',
    text: 'Upload a document',
    hint: 'PDF, Word documents',
  },
};

export const Disabled: Story = {
  args: {
    accept: 'image/*',
    icon: '📷',
    text: 'Upload is disabled',
    disabled: true,
  },
};
