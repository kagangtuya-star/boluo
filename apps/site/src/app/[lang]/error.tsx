'use client';

import { Refresh } from 'icons';
import { useEffect } from 'react';
import { Button } from 'ui/Button';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="p-4">
      <div className="text-xl">Oops</div>
      <div className="py-2">Something went very wrong. Please try again later or contact admin.</div>

      <div className="py-2">
        <a className="text-blue-600 underline" href="/">
          Back to Home
        </a>
      </div>

      <div>
        <div className="py-2 text-sm">Tech details:</div>

        <div>
          <span className="bg-error-600 text-lowest mr-2 rounded px-2">{error.name}</span>
          <span className="font-mono">{error.message}</span>
        </div>
      </div>
    </div>
  );
}
