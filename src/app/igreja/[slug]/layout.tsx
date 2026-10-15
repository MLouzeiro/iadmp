'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import '@/components/public/site/novosite.css';

interface IgrejaLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default function IgrejaLayout({ children, params }: IgrejaLayoutProps) {
  const [slug, setSlug] = useState('');

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  return <ThemeProvider slug={slug || undefined}>{children}</ThemeProvider>;
}
