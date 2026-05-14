import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const LandingPage = ({ onEnterApp }: { onEnterApp: () => void }) => {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && event.data.type === 'ENTER_SYSTEM') {
        onEnterApp();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onEnterApp]);

  return (
    <div className="h-screen w-full bg-[#080B13] text-white">
      <div className="w-full h-full">
        <iframe
          title="globaluntoldstory"
          src="/globaluntoldstory/index.html"
          className="w-full h-full border-0"
          loading="eager"
        />
      </div>
    </div>
  );
};

export { LandingPage };
