import type { Meta, StoryObj } from '@storybook/react';
import { EventSetupWizard } from './EventSetupWizard';
import { BrowserRouter } from 'react-router-dom';
import { withFirebaseEmulator } from '../../.storybook/firebase-decorator';
import { fn } from 'storybook/test';

/**
 * EventSetupWizard Component Stories
 * 
 * A comprehensive multi-step wizard for setting up cookie voting events.
 * This wizard guides users through uploading images, naming categories, adding bakers, and tagging cookies.
 */
const meta = {
  title: 'Organisms/EventSetupWizard',
  component: EventSetupWizard,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A comprehensive multi-step wizard for setting up cookie voting events.

**Features:**
- **Step 1 - Upload Images**: Upload category images with drag-and-drop or file picker
- **Step 2 - Name Categories**: Assign names to each uploaded image/category
- **Step 3 - Add Bakers**: Add baker names that will be associated with cookies
- **Step 4 - Tag Cookies**: Tag cookies in each category image, optionally using AI detection

**Usage:**
This component is used in the admin interface to set up new voting events or edit existing ones.
It handles the complete workflow from image upload to cookie tagging.

**Firebase Integration:**
This component requires Firebase emulators to be running for full functionality.
Use the \`WithFirebaseEmulator\` story to test with real Firebase services.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    eventId: {
      control: 'text',
      description: 'Unique identifier for the event',
    },
    eventName: {
      control: 'text',
      description: 'Display name of the event',
    },
    onComplete: {
      action: 'completed',
      description: 'Callback when wizard is completed',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback when wizard is cancelled',
    },
    initialCategoryId: {
      control: 'text',
      description: 'Optional category ID to start editing from',
    },
    autoAdvance: {
      control: 'boolean',
      description: 'Whether to auto-advance after tagging cookies',
    },
  },
} satisfies Meta<typeof EventSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story showing the wizard in initial state (upload step)
 * Note: This story requires Firebase emulators for full functionality
 */
export const Default: Story = {
  args: {
    eventId: 'test-event-123',
    eventName: 'Test Cookie Voting Event',
    onComplete: fn(),
    onCancel: fn(),
    autoAdvance: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Default state showing the wizard at the initial upload step.
Users can upload images for categories using drag-and-drop or the file picker.
        `,
      },
    },
  },
};

/**
 * Story with Firebase emulator integration
 * This story demonstrates the full wizard workflow with real Firebase services
 */
export const WithFirebaseEmulator: Story = {
  decorators: [
    withFirebaseEmulator,
  ],
  args: {
    eventId: 'storybook-test-event',
    eventName: 'Storybook Test Event',
    onComplete: fn(),
    onCancel: fn(),
    autoAdvance: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
This story uses the Firebase emulator to provide full functionality.
Make sure to start the Firebase emulators before viewing this story:
\`npm run emulators:start\`

The wizard will be able to:
- Upload images to Firebase Storage
- Save categories and bakers to Firestore
- Load existing event data
- Tag cookies with full persistence
        `,
      },
    },
  },
};

/**
 * Story with auto-advance enabled
 * This story demonstrates the wizard with automatic progression after tagging
 */
export const WithAutoAdvance: Story = {
  args: {
    eventId: 'test-event-auto',
    eventName: 'Auto-Advance Test Event',
    onComplete: fn(),
    onCancel: fn(),
    autoAdvance: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
This story shows the wizard with auto-advance enabled.
After tagging cookies in a category, the wizard will automatically
move to the next category or step.
        `,
      },
    },
  },
};

/**
 * Story for editing an existing event
 * This story demonstrates loading existing event data
 */
export const EditingExistingEvent: Story = {
  decorators: [
    withFirebaseEmulator,
  ],
  args: {
    eventId: 'existing-event-123',
    eventName: 'Existing Event',
    onComplete: fn(),
    onCancel: fn(),
    initialCategoryId: 'category-1',
    autoAdvance: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates editing an existing event.
The wizard will load existing categories, bakers, and tagged cookies
from Firestore and allow editing them.

Note: This requires Firebase emulators to be running and the event
to exist in the emulator database.
        `,
      },
    },
  },
};

