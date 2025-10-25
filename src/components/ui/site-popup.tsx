'use client';

import React from 'react';
import { usePublicSettings } from '@/hooks/useApi';
import { usePathname } from 'next/navigation';

export const SitePopup: React.FC = () => {
  const { data } = usePublicSettings();
  const [visible, setVisible] = React.useState(false);
  const pathname = usePathname();
  // Guard to ensure we only decide/show once per page load (mount)
  const hasTriedToShowRef = React.useRef(false);

  React.useEffect(() => {
    // Run only once after settings are available
    if (hasTriedToShowRef.current) return;
    if (!data) return;
    hasTriedToShowRef.current = true;

    // Don't show popup in admin area
    if (pathname.startsWith('/admin')) return;
    if (!data.popupEnabled) return;

    const delaySeconds = Math.max(0, Number(data.popupDelaySeconds || 3));
    const timer = setTimeout(() => {
      setVisible(true);
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [data]);

  if (!data || !data.popupEnabled || !visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setVisible(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-hidden">
        <button
          onClick={() => setVisible(false)}
          aria-label="Закрыть"
          className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ×
        </button>
        <div className="p-6">
          {data.popupTemplate === 'center' && (
            <div className="space-y-4">
              {data.popupImageUrl ? (
                <div className="flex justify-center">
                  <img 
                    src={data.popupImageUrl} 
                    alt="" 
                    className="max-w-full h-auto max-h-96 object-cover rounded-lg border-4 border-gray-200 shadow-md" 
                  />
                </div>
              ) : null}
              {data.popupTitle ? (
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center">{data.popupTitle}</h3>
              ) : null}
              {data.popupText ? (
                <div className="text-sm sm:text-base text-gray-700 whitespace-pre-line text-center leading-relaxed max-w-2xl mx-auto">{data.popupText}</div>
              ) : null}
              {data.popupButtonUrl && data.popupButtonLabel ? (
                <div className="flex justify-center pt-2">
                  <a
                    href={data.popupButtonUrl}
                    target={data.popupButtonUrl.startsWith('http') ? '_blank' : undefined}
                    rel={data.popupButtonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    {data.popupButtonLabel}
                  </a>
                </div>
              ) : null}
            </div>
          )}

          {data.popupTemplate === 'image-right' && (
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1 space-y-4">
                {data.popupTitle ? (
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{data.popupTitle}</h3>
                ) : null}
                {data.popupText ? (
                  <div className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">{data.popupText}</div>
                ) : null}
                {data.popupButtonUrl && data.popupButtonLabel ? (
                  <div className="pt-2">
                    <a
                      href={data.popupButtonUrl}
                      target={data.popupButtonUrl.startsWith('http') ? '_blank' : undefined}
                      rel={data.popupButtonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {data.popupButtonLabel}
                    </a>
                  </div>
                ) : null}
              </div>
              {data.popupImageUrl ? (
                <div className="flex-shrink-0">
                  <img 
                    src={data.popupImageUrl} 
                    alt="" 
                    className="w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-lg border-4 border-gray-200 shadow-md" 
                  />
                </div>
              ) : null}
            </div>
          )}

          {data.popupTemplate === 'image-left' && (
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              {data.popupImageUrl ? (
                <div className="flex-shrink-0">
                  <img 
                    src={data.popupImageUrl} 
                    alt="" 
                    className="w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-lg border-4 border-gray-200 shadow-md" 
                  />
                </div>
              ) : null}
              <div className="flex-1 space-y-4">
                {data.popupTitle ? (
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{data.popupTitle}</h3>
                ) : null}
                {data.popupText ? (
                  <div className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">{data.popupText}</div>
                ) : null}
                {data.popupButtonUrl && data.popupButtonLabel ? (
                  <div className="pt-2">
                    <a
                      href={data.popupButtonUrl}
                      target={data.popupButtonUrl.startsWith('http') ? '_blank' : undefined}
                      rel={data.popupButtonUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      {data.popupButtonLabel}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


