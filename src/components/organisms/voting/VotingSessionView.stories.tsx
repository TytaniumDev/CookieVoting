import type { Meta, StoryObj } from '@storybook/react';
import { VotingSessionView } from './VotingSessionView';
import { useState } from 'react';
import { testCategories } from '../../../stories/data/test-cookies';

const meta: Meta<typeof VotingSessionView> = {
  title: 'Organisms/Voting/VotingSessionView',
  component: VotingSessionView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof VotingSessionView>;

const InteractiveStory = ({ initialVotes = {} }: { initialVotes?: Record<string, string[]> }) => {
  const [votes, setVotes] = useState<Record<string, string[]>>(initialVotes);

  return (
    <VotingSessionView
      categories={testCategories}
      votes={votes}
      onVote={(catId, cookieId) => setVotes((prev) => ({ ...prev, [catId]: [cookieId] }))}
      onComplete={() => console.log('Completed!')}
    />
  );
};

export const Default: Story = {
  render: () => {
    // Get first cookie ID from first category for initial vote
    const firstCookieId = testCategories[0]?.cookies[0]?.id;
    return <InteractiveStory initialVotes={firstCookieId ? { '1': [firstCookieId] } : {}} />;
  },
};

import { within, userEvent, expect, waitFor } from 'storybook/test';

export const ValidUserJourneyTest: Story = {
  render: () => <InteractiveStory />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // 1. Initial State: Category 1
    await step('Start Voting', async () => {
      await waitFor(() => expect(canvas.getByText(testCategories[0].name)).toBeInTheDocument());
      await expect(canvas.getByText('Category 1 of 4')).toBeInTheDocument();
    });

    // 2. Select a Cookie
    await step('Vote for Cookie 1', async () => {
      // Get first cookie ID from first category
      const firstCookieId = testCategories[0]?.cookies[0]?.id || 'c_A';
      const cookie1 = canvas.getByLabelText(`Select cookie ${firstCookieId}`);
      await userEvent.click(cookie1);

      const nextBtn = canvas.getByText('Next Category');
      await waitFor(() => expect(nextBtn).toBeVisible());
    });

    // 3. Go Next
    await step('Navigate to Category 2', async () => {
      const nextBtn = canvas.getByText('Next Category');
      await userEvent.click(nextBtn);

      // Wait until old slide is gone
      await waitFor(
        () => {
          expect(canvas.queryByText('Best Taste')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await expect(canvas.getByText('Category 2 of 4')).toBeInTheDocument();
      await expect(canvas.getByText('Best Look')).toBeInTheDocument();
    });

    // 4. Go Back
    await step('Go back to Category 1', async () => {
      const backBtn = canvas.getByLabelText('Go back');
      await userEvent.click(backBtn);

      await waitFor(
        () => {
          expect(canvas.queryByText('Best Look')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await expect(canvas.getByText('Best Taste')).toBeInTheDocument();
    });

    // 5. Go Next Again
    await step('Return to Category 2', async () => {
      const nextBtn = canvas.getByText('Next Category');
      await waitFor(() => expect(nextBtn).toBeVisible());
      await userEvent.click(nextBtn);

      await waitFor(
        () => {
          expect(canvas.queryByText('Best Taste')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    // 6. Complete remaining
    await step('Vote through remaining categories', async () => {
      // Cat 2 (Best Look) - Get first cookie ID
      const cookie1Cat2Id = testCategories[1]?.cookies[0]?.id || 'c_D';
      const cookie1Cat2 = await canvas.findByLabelText(`Select cookie ${cookie1Cat2Id}`);
      await userEvent.click(cookie1Cat2);

      const nextBtn = canvas.getByText('Next Category');
      await waitFor(() => expect(nextBtn).toBeVisible());
      await userEvent.click(nextBtn);
      await waitFor(() => expect(canvas.queryByText('Best Look')).not.toBeInTheDocument(), {
        timeout: 3000,
      });

      // Cat 3 (Most Creative)
      const cookie1Cat3Id = testCategories[2]?.cookies[0]?.id || 'c_H';
      const cookie1Cat3 = await canvas.findByLabelText(`Select cookie ${cookie1Cat3Id}`);
      await userEvent.click(cookie1Cat3);

      const nextBtn2 = canvas.getByText('Next Category');
      await waitFor(() => expect(nextBtn2).toBeVisible());
      await userEvent.click(nextBtn2);
      await waitFor(() => expect(canvas.queryByText('Most Creative')).not.toBeInTheDocument(), {
        timeout: 3000,
      });

      // Cat 4 (Holiday Spirit) - Last One
      const cookie1Cat4Id = testCategories[3]?.cookies[0]?.id || 'c_M';
      const cookie1Cat4 = await canvas.findByLabelText(`Select cookie ${cookie1Cat4Id}`);
      await userEvent.click(cookie1Cat4);

      // Button should change text
      const finishBtn = canvas.getByText('Finish Voting');
      await waitFor(() => expect(finishBtn).toBeVisible());
      await userEvent.click(finishBtn);
    });
  },
};
