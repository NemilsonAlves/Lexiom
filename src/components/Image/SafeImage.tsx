import React, { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  onError?: () => void;
  onLoad?: () => void;
};

export default function SafeImage({ src, alt, className, width, height, onError, onLoad }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error' | 'timeout'>('idle');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setStatus('loading');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'timeout' : s));
    }, 2000);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [src]);

  function handleLoad() {
    if (timer.current) window.clearTimeout(timer.current);
    setStatus('loaded');
    onLoad?.();
  }

  function handleError() {
    if (timer.current) window.clearTimeout(timer.current);
    setStatus('error');
    onError?.();
  }

  const common = { width, height } as const;

  return (
    <div className={className} style={{ ...common }}>
      {(status === 'loading' || status === 'idle') && (
        <div className="bg-gray-100 animate-pulse w-full h-full" aria-label="Carregando imagem" />
      )}
      {status === 'timeout' && (
        <div className="bg-gray-200 flex items-center justify-center text-xs text-gray-600 w-full h-full" aria-label="Tempo de carregamento excedido">Imagem lenta</div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: status === 'loaded' ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
