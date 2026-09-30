import type { Preview } from '@storybook/react-vite'
import '../src/styles/index.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    // Fail story tests on accessibility violations.
    a11y: { test: 'error' },
  },
}

export default preview
