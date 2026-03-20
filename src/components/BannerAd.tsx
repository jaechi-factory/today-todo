import { useEffect, useRef } from 'react';
import { TossAds } from '@apps-in-toss/web-bridge';

interface Props {
  adGroupId: string;
  variant?: 'card' | 'expanded';
}

export default function BannerAd({ adGroupId, variant = 'expanded' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try { if (!TossAds.initialize.isSupported()) return; } catch { return; }

    let bannerResult: { destroy: () => void } | null = null;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          if (!ref.current) return;
          bannerResult = TossAds.attachBanner(adGroupId, ref.current, {
            theme: 'auto',
            tone: 'grey',
            variant,
          });
        },
        onInitializationFailed: () => {},
      },
    });

    return () => { bannerResult?.destroy(); };
  }, [adGroupId, variant]);

  return <div ref={ref} style={{ width: '100%', minHeight: 96, flexShrink: 0 }} />;
}
