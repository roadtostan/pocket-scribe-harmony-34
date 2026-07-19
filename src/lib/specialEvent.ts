import { differenceInSeconds } from 'date-fns';

export type EventConfig = {
  id: string;
  event_key: string;
  birthday_date: string;
  gift_open_date: string;
  gift_close_date: string;
  letter_date: string;
  timezone: string;
  letter_content: string | null;
};

export type EventState =
  | 'COUNTDOWN'
  | 'GIFT_SELECTION'
  | 'GIFT_CLOSED'
  | 'LETTER'
  | 'HAPPY_BIRTHDAY';

export function getEventState(cfg: EventConfig, now: Date = new Date()): EventState {
  const birthday = new Date(cfg.birthday_date);
  const giftOpen = new Date(cfg.gift_open_date);
  const giftClose = new Date(cfg.gift_close_date);
  const letter = new Date(cfg.letter_date);
  if (now >= birthday) return 'HAPPY_BIRTHDAY';
  if (now >= letter) return 'LETTER';
  if (now >= giftClose) return 'GIFT_CLOSED';
  if (now >= giftOpen) return 'GIFT_SELECTION';
  return 'COUNTDOWN';
}

export function getNextMilestone(cfg: EventConfig, now: Date = new Date()) {
  const state = getEventState(cfg, now);
  switch (state) {
    case 'COUNTDOWN':
      return { label: 'Gift selection opens in', target: new Date(cfg.gift_open_date) };
    case 'GIFT_SELECTION':
      return { label: 'Selection closes in', target: new Date(cfg.gift_close_date) };
    case 'GIFT_CLOSED':
      return { label: 'Letter unlocks in', target: new Date(cfg.letter_date) };
    case 'LETTER':
      return { label: 'Birthday in', target: new Date(cfg.birthday_date) };
    case 'HAPPY_BIRTHDAY':
      return { label: 'Happy Birthday!', target: new Date(cfg.birthday_date) };
  }
}

export function breakdown(target: Date, now: Date = new Date()) {
  let s = Math.max(0, differenceInSeconds(target, now));
  const days = Math.floor(s / 86400); s -= days * 86400;
  const hours = Math.floor(s / 3600); s -= hours * 3600;
  const minutes = Math.floor(s / 60); s -= minutes * 60;
  return { days, hours, minutes, seconds: s };
}

export function getBadge(cfg: EventConfig, now: Date = new Date()): string {
  const state = getEventState(cfg, now);
  if (state === 'HAPPY_BIRTHDAY') return '🎂';
  if (state === 'LETTER') return '📩';
  if (state === 'GIFT_CLOSED') return '🔒';
  if (state === 'GIFT_SELECTION') return '🎁';
  const days = breakdown(new Date(cfg.gift_open_date), now).days;
  return days > 0 ? `${days}d` : 'Soon';
}
