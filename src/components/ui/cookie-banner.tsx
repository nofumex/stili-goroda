'use client';

import React from 'react';
import Link from 'next/link';

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const accepted = window.localStorage.getItem('cookie-consent');
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem('cookie-consent', 'true');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4">
      <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-700">
          Пользуясь сайтом, вы соглашаетесь с использованием cookie и{' '}
          <Link href="/privacy" className="text-primary-600 hover:text-primary-500 underline">
            Политикой конфиденциальности
          </Link>
          . Если вы не согласны, покиньте сайт или ограничьте cookie в настройках браузера.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-500 transition-colors"
          >
            Хорошо
          </button>
        </div>
      </div>
    </div>
  );
};


