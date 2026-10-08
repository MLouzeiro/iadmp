'use client';

import { useState } from 'react';
import { faqs } from '@/data/site-data';
import FaqAccordion, { FaqItem } from '@/components/ui/FaqAccordion';

export default function FaqSection() {
  const items: FaqItem[] = faqs.map((f) => ({ q: f.question, a: f.answer }));
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <FaqAccordion items={items} />
    </div>
  );
}
