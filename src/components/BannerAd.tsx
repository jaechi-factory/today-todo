import { useEffect, useRef } from 'react';
import { TossAds } from '@apps-in-toss/web-bridge';

const AD_GROUP_ID = 'ait-ad-test-banner-id';

export default function BannerAd() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!TossAds.initialize.isSupported()) return;

    let bannerResult: { destroy: () => void } | null = null;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          if (!ref.current || !TossAds.attachBanner.isSupported()) return;
          bannerResult = TossAds.attachBanner(AD_GROUP_ID, ref.current, {
            theme: 'auto',
            tone: 'blackAndWhite',
            variant: 'expanded',
          });
        },
        onInitializationFailed: () => {},
      },
    });

    return () => {
      bannerResult?.destroy();
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', minHeight: 96, flexShrink: 0 }} />;
}
