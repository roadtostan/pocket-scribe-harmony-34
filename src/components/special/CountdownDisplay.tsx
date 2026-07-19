import { breakdown } from '@/lib/specialEvent';
import { useNow } from '@/hooks/useEventConfig';

export default function CountdownDisplay({ target, label }: { target: Date; label: string }) {
  const now = useNow(1000);
  const t = breakdown(target, now);
  const box = (v: number, l: string) => (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur rounded-xl px-3 py-2 min-w-[64px]">
      <span className="text-2xl md:text-3xl font-bold tabular-nums">{String(v).padStart(2, '0')}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-80">{l}</span>
    </div>
  );
  return (
    <div className="text-center">
      <p className="text-sm mb-3 opacity-90">{label}</p>
      <div className="flex justify-center gap-2">
        {box(t.days, 'Days')}
        {box(t.hours, 'Hours')}
        {box(t.minutes, 'Min')}
        {box(t.seconds, 'Sec')}
      </div>
    </div>
  );
}
