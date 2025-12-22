import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { VotingResultsView } from './VotingResultsView';
import { testCategories } from '../../../stories/data/test-cookies';
import type { CategoryResult } from '../../../lib/hooks/useResultsData';

const meta: Meta<typeof VotingResultsView> = {
  title: 'Organisms/Voting/VotingResultsView',
  component: VotingResultsView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof VotingResultsView>;

// Generate mock results from testCategories
const mockResults: CategoryResult[] = testCategories.map((cat, catIdx) => ({
  category: cat,
  scores: cat.cookies.map((cookie, i) => ({
    cookieNumber: cookie.number,
    // Create some varied scores: 1st place gets more, some ties for 2nd/3rd
    votes: catIdx === 0 && i < 2 ? 10 : cat.cookies.length - i,
    maker: cookie.makerName || `Baker ${cookie.number}`,
    cookie: cookie,
  })),
  detectedCookies: cat.cookies.map((c) => c.detection).filter((d): d is DetectedCookie => !!d),
}));

export const Default: Story = {
  args: {
    eventName: 'Cookie Off Results',
    results: mockResults,
  },
};

export const Ties: Story = {
  args: {
    eventName: 'Cookie Off (Ties)',
    results: [
      {
        category: testCategories[0],
        scores: [
          { cookieNumber: 1, votes: 5, maker: 'Tie 1A', cookie: testCategories[0].cookies[0] },
          { cookieNumber: 2, votes: 5, maker: 'Tie 1B', cookie: testCategories[0].cookies[1] },
          { cookieNumber: 3, votes: 3, maker: 'Third', cookie: testCategories[0].cookies[2] },
        ],
        detectedCookies: testCategories[0].cookies
          .map((c) => c.detection)
          .filter((d): d is DetectedCookie => !!d),
      },
    ],
  },
};

export const ResultsNavigationTest: Story = {
  args: { ...Default.args },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Initial Intro Tile Display', async () => {
      await expect(canvas.getByText('🏆 Results Are In! 🏆')).toBeInTheDocument();
      await expect(canvas.getByText('Cookie Off Results')).toBeInTheDocument();
      await expect(canvas.getByText('1 / 6')).toBeInTheDocument();
    });

    await step('Navigate to First Category', async () => {
      const nextBtn = canvas.getByLabelText('Next');
      await userEvent.click(nextBtn);

      // Wait for first category to appear
      await waitFor(() => {
        expect(canvas.getByText('Best Taste Results')).toBeInTheDocument();
        expect(canvas.getByText('2 / 6')).toBeInTheDocument();
      });
    });

    await step('Navigate to Second Category', async () => {
      const nextBtn = canvas.getByLabelText('Next');
      await userEvent.click(nextBtn);

      // Wait for next category Title
      await waitFor(() => {
        expect(canvas.getByText('Best Look Results')).toBeInTheDocument();
        expect(canvas.getByText('3 / 6')).toBeInTheDocument();
      });
    });

    await step('Navigate Back to First Category', async () => {
      const prevBtn = canvas.getByLabelText('Previous');
      await userEvent.click(prevBtn);

      // Wait to go back to first category
      await waitFor(() => {
        expect(canvas.getByText('Best Taste Results')).toBeInTheDocument();
        expect(canvas.getByText('2 / 6')).toBeInTheDocument();
      });
    });
  },
};
