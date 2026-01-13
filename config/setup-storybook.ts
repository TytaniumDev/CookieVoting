import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './test-preview';

setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
