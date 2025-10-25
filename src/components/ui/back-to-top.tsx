"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackToTopProps {
  threshold?: number; // pixels scrolled before showing
  className?: string;
}

export function BackToTop({ threshold = 600, className }: BackToTopProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(y > threshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-40 transition-opacity duration-200',
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        className
      )}
      aria-hidden={!isVisible}
   >
      <Button
        variant="default"
        size="icon"
        aria-label="Наверх"
        onClick={scrollToTop}
        className="shadow-lg shadow-black/10"
      >
        {/* Up arrow icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M12 4a.75.75 0 01.53.22l7 7a.75.75 0 11-1.06 1.06L12.75 6.56V20a.75.75 0 01-1.5 0V6.56L5.53 12.28a.75.75 0 11-1.06-1.06l7-7A.75.75 0 0112 4z" clipRule="evenodd" />
        </svg>
      </Button>
    </div>
  );
}


