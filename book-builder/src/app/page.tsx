'use client';

import { useBookStore } from '@/store/useBookStore';
import { WizardContainer } from '@/components/WizardContainer';
import {
  AISetupStep,
  BookDescriptionStep,
  TOCGenerationStep,
  FeatureSelectionStep,
  GitHubSetupStep,
  GenerateBookStep,
  ChapterEditorStep,
} from '@/components/steps';

export default function Home() {
  const { currentStep } = useBookStore();

  const renderStep = () => {
    switch (currentStep) {
      case 'ai-setup':
        return <AISetupStep />;
      case 'book-description':
        return <BookDescriptionStep />;
      case 'toc-generation':
        return <TOCGenerationStep />;
      case 'feature-selection':
        return <FeatureSelectionStep />;
      case 'github-setup':
        return <GitHubSetupStep />;
      case 'generate-book':
        return <GenerateBookStep />;
      case 'chapter-editor':
        return <ChapterEditorStep />;
      default:
        return <AISetupStep />;
    }
  };

  return (
    <WizardContainer>
      {renderStep()}
    </WizardContainer>
  );
}
