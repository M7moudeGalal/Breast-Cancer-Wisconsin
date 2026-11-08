import React from 'react';
import Hero from './Hero.jsx';
import PipelineFlow from './PipelineFlow.jsx';
import DatasetAnatomy from './DatasetAnatomy.jsx';
import BreastCancerGuide from './BreastCancerGuide.jsx';
import { Reveal } from './ui.jsx';

export default function Overview({ onOpenGuide, onGoToTry, onGoToCases }) {
  return (
    <div className="space-y-8">
      <Hero onOpenGuide={onOpenGuide} onGoToTry={onGoToTry} onGoToCases={onGoToCases} />
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
        <Reveal>
          <PipelineFlow />
        </Reveal>
        <Reveal delay={0.06}>
          <DatasetAnatomy />
        </Reveal>
        <Reveal delay={0.08}>
          <BreastCancerGuide />
        </Reveal>
      </div>
    </div>
  );
}

