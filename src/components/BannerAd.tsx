import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-bridge';

interface Props {
  adGroupId: string;
  variant?: 'card' | 'expanded';
}

function getTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function BannerAd({ adGroupId, variant = 'expanded' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (!TossAds.initialize.isSupported()) return;

    let bannerResult: { destroy: () => void } | null = null;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          if (!ref.current || !TossAds.attachBanner.isSupported()) return;
          bannerResult = TossAds.attachBanner(adGroupId, ref.current, {
            theme,
            tone: 'grey',
            variant,
          });
        },
        onInitializationFailed: () => {},
      },
    });

    return () => {
      bannerResult?.destroy();
    };
  }, [adGroupId, variant, theme]);

  return <div ref={ref} style={{ width: '100%', minHeight: 96, flexShrink: 0 }} />;
}
