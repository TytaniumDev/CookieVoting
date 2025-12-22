import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ImageUploadStep } from './ImageUploadStep';
import { CategoryNamingStep } from './CategoryNamingStep';
import { BakerSetupStep } from './BakerSetupStep';

const meta: Meta = {
  title: 'Organisms/EventSetupWizard/Steps',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const ImageUpload: StoryObj<typeof ImageUploadStep> = {
  render: () => (
    <ImageUploadStep
      images={[]}
      uploading={false}
      onFilesSelect={() => {}}
      onRemoveImage={() => {}}
      onUpload={async () => {}}
      onCancel={() => {}}
      onNext={() => {}}
      hasExistingCategories={false}
    />
  ),
};

export const CategoryNaming: StoryObj<typeof CategoryNamingStep> = {
  render: () => (
    <CategoryNamingStep
      images={[
        {
          file: {} as File,
          preview: 'https://via.placeholder.com/150',
          uploaded: true,
          categoryName: 'Sugar Cookie',
        },
        {
          file: {} as File,
          preview: 'https://via.placeholder.com/150',
          uploaded: true,
          categoryName: '',
        },
      ]}
      uploading={false}
      onNameChange={() => {}}
      onCreateCategories={async () => {}}
      onBack={() => {}}
      onNext={() => {}}
      hasExistingCategories={true}
    />
  ),
};

export const BakerSetup: StoryObj<typeof BakerSetupStep> = {
  render: () => (
    <BakerSetupStep
      bakers={[
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ]}
      onAddBaker={async () => {}}
      onRemoveBaker={async () => {}}
      onBack={() => {}}
      onNext={() => {}}
      hasExistingCategories={true}
    />
  ),
};
