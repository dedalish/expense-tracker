import { cn } from '@/shared/lib/utils';

const RAYS = 12;

/** Знак приложения: венок из лучей, как монетки вокруг центра. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden
      className={cn('shrink-0', className)}
      fill="currentColor"
    >
      {Array.from({ length: RAYS }, (_, i) => (
        <rect
          key={i}
          x="17.5"
          y="3"
          width="5"
          height="11"
          rx="2.5"
          transform={`rotate(${(360 / RAYS) * i} 20 20)`}
        />
      ))}
    </svg>
  );
}
