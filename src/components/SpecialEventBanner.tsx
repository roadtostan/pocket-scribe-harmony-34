import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Gift, Mail, Cake, Clock } from 'lucide-react';
import { useEventConfig, useNow } from '@/hooks/useEventConfig';
import { breakdown, getEventState, getNextMilestone } from '@/lib/specialEvent';

export default function SpecialEventBanner() {
  const { config } = useEventConfig();
  const now = useNow(1000);
  const navigate = useNavigate();
  if (!config) return null;

  const state = getEventState(config, now);
  const milestone = getNextMilestone(config, now);
  const t = breakdown(milestone.target, now);

  const iconFor = () => {
    switch (state) {
      case 'HAPPY_BIRTHDAY': return <Cake size={22} className="animate-bounce" />;
      case 'LETTER': return <Mail size={22} className="animate-pulse" />;
      case 'GIFT_CLOSED': return <Clock size={22} />;
      case 'GIFT_SELECTION': return <Gift size={22} className="animate-pulse" />;
      default: return <Sparkles size={22} className="animate-spin" />;
    }
  };

  const title = () => {
    switch (state) {
      case 'HAPPY_BIRTHDAY': return '🎂 Happy Birthday, Sayang!';
      case 'LETTER': return '📩 A Letter is Waiting';
      case 'GIFT_CLOSED': return '🔒 Selection Locked';
      case 'GIFT_SELECTION': return '🎁 Pick Your Gifts';
      default: return '✨ Something Special is Coming';
    }
  };

  return (
    <div className="mb-4 mx-4">
      <Card
        onClick={() => navigate('/special')}
        className="cursor-pointer border-0 shadow-lg bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white overflow-hidden active:scale-[0.99] transition-transform"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0">{iconFor()}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-tight">{title()}</h3>
              {state !== 'HAPPY_BIRTHDAY' && (
                <p className="text-xs opacity-90 mt-0.5">
                  {milestone.label}{' '}
                  <span className="font-semibold">
                    {t.days}d {String(t.hours).padStart(2, '0')}h {String(t.minutes).padStart(2, '0')}m {String(t.seconds).padStart(2, '0')}s
                  </span>
                </p>
              )}
              {state === 'HAPPY_BIRTHDAY' && (
                <p className="text-xs opacity-90 mt-0.5">Tap to open your surprise 💕</p>
              )}
            </div>
            <span className="text-2xl">→</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
