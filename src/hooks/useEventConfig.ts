import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EventConfig } from '@/lib/specialEvent';

export const EVENT_KEY = 'birthday_2026';

export function useEventConfig() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('event_config')
        .select('*')
        .eq('event_key', EVENT_KEY)
        .maybeSingle();
      if (mounted) {
        setConfig(data as EventConfig | null);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { config, loading };
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
