import type { Preview } from '@storybook/react-vite'
import '../src/styles/index.css'

const preview: Preview = {
  // A generated docs page (props table + every story) for each component.
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    // Fail story tests on accessibility violations.
    a11y: { test: 'error' },
  },
}

export default preview
