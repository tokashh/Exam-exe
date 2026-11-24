import React, { useState } from 'react';

interface CyberIllustrationProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  scrimClassName?: string;
  fallbackLabel?: string;
  eager?: boolean;
  accent?: 'green' | 'cyan' | 'red';
}

export const CyberIllustration: React.FC<CyberIllustrationProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  scrimClassName = 'bg-gradient-to-t from-[#080B0D] via-[#080B0D]/45 to-transparent',
  fallbackLabel,
  eager = false,
  accent = 'cyan',
}) => {
  const [hasError, setHasError] = useState(false);

  const strokeColor =
    accent === 'green' ? '#75FFAE' : accent === 'red' ? '#FF626C' : '#5AD9F5';

  return (
    <div
      className={`relative overflow-hidden bg-[#0A0F12] ${className}`}
      role="img"
      aria-label={alt}
    >
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setHasError(true)}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#080B0D] via-[#11181B] to-[#0B1418] p-4">
          <svg
            viewBox="0 0 160 72"
            className="h-14 w-36 opacity-80"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="6"
              y="6"
              width="148"
              height="60"
              rx="8"
              stroke={strokeColor}
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
            <path
              d="M22 36 H54 L66 20 H94 L106 52 H138"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="54" cy="36" r="3" fill={strokeColor} />
            <circle cx="94" cy="20" r="3" fill={strokeColor} />
            <circle cx="106" cy="52" r="3" fill={strokeColor} />
          </svg>
          {fallbackLabel && (
            <span className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#8A9993]">
              {fallbackLabel}
            </span>
          )}
        </div>
      )}

      {scrimClassName && (
        <div className={`pointer-events-none absolute inset-0 ${scrimClassName}`} />
      )}
    </div>
  );
};
