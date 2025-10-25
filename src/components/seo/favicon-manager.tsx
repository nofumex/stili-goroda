'use client';

import React, { useEffect } from 'react';
import { usePublicSettings } from '@/hooks/useApi';

export const FaviconManager: React.FC = () => {
  const { data: publicSettings } = usePublicSettings();

  useEffect(() => {
    if (!publicSettings) return;

    const href = publicSettings.favicon || '';

    // ensure a <link rel="icon"> exists and points to current href or default
    const setFavicon = (iconHref: string) => {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = iconHref || '/favicon.ico';
    };

    setFavicon(href);
  }, [publicSettings]);

  return null;
};


