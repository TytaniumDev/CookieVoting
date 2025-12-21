import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from './Layout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

/**
 * Layout Component Stories
 * 
 * Main layout wrapper component that provides consistent page structure.
 */
const meta = {
  title: 'Templates/Layout',
  component: Layout,
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
Main layout wrapper component that provides consistent page structure.

**Features:**
- Conditional header/footer (hidden on landing page)
- Logo/branding link
- Authentication button in header
- Main content area via React Router Outlet
- Responsive design

**Usage:**
This component wraps all routes in the application to provide consistent layout.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default layout with sample content
 */
export const Default: Story = {
  render: () => (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <Layout>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Sample Page Content</h1>
                <p>This is sample content inside the Layout component.</p>
              </div>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  ),
};

/**
 * Layout on landing page (no header/footer)
 */
export const LandingPage: Story = {
  render: () => (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <Layout>
              <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh' }}>
                <h1>Landing Page</h1>
                <p>Header and footer are hidden on the landing page.</p>
              </div>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  ),
};
