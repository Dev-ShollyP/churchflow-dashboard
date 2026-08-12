import { addDays, format, isAfter, isSameDay, setHours, setMinutes, getDate, getDay } from 'date-fns';

export interface ChurchEvent {
  id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time?: string;   // HH:mm
  location?: string;
  description?: string;
  category?: 'recurring' | 'special';
  is_recurring?: boolean;
  image_url?: string;
  flyer_url?: string;
}

/**
 * Determines the RCCG Sunday service type by week-of-month.
 */
function getSundayServiceType(date: Date): { title: string; description: string } {
  const dayOfMonth = getDate(date); // 1–31
  const weekOfMonth = Math.ceil(dayOfMonth / 7); // 1–5

  switch (weekOfMonth) {
    case 1:
      return {
        title: '1st Sunday — Thanksgiving Service',
        description: 'Glorious Celebration: Praise, Worship & Thanksgiving Offering',
      };
    case 2:
      return {
        title: '2nd Sunday — Prayer Sunday',
        description: 'Glorious Celebration: Corporate Intercessory Prayer & Word Service',
      };
    case 3:
      return {
        title: '3rd Sunday — Youth Sunday',
        description: 'Glorious Celebration: Youth-Led Praise, Worship & Word Service',
      };
    case 4:
      return {
        title: '4th Sunday — Super Sunday (Relationship Sunday)',
        description: 'Glorious Celebration: Marriage, Family & Relationship Ministry Service',
      };
    case 5:
    default:
      return {
        title: '5th Sunday — CSR / Welfare Sunday',
        description: 'Glorious Celebration: Community Service & Welfare Outreach Service',
      };
  }
}

export const WEEKLY_SERVICES = [
  {
    dayOfWeek: 2, // Tuesday
    dayName: 'Tuesday',
    title: 'Digging Deep (Bible Study)',
    startTime: '18:00',
    endTime: '19:30',
    location: 'Main Sanctuary',
    description: 'Bilingual Word Study & Spiritual Growth Service',
  },
  {
    dayOfWeek: 4, // Thursday
    dayName: 'Thursday',
    title: 'Faith Clinic (Prayer & Deliverance)',
    startTime: '18:00',
    endTime: '19:00',
    location: 'Main Sanctuary',
    description: 'Intercession, Divine Healing & Deliverance Service',
  },
  {
    dayOfWeek: 0, // Sunday
    dayName: 'Sunday',
    title: 'Sunday Worship Service',
    startTime: '08:00',
    endTime: '12:00',
    location: 'Main Sanctuary',
    description: 'Worship, Word & Breakthrough Session',
  },
];

/**
 * Returns the single next upcoming service from today onward (first match within 14 days).
 * Takes exact time into account: if today is service day but start time has passed, jumps to NEXT service day.
 */
export function getNextUpcomingService(customDbEvents: ChurchEvent[] = []): ChurchEvent | null {
  const now = new Date();

  for (let i = 0; i <= 14; i++) {
    const targetDate = addDays(now, i);
    const dayOfWeek = targetDate.getDay();
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    // Check custom DB events first
    const customOnDate = customDbEvents.find(ev => ev.event_date === dateStr);
    if (customOnDate) return customOnDate;

    // Check weekly services
    const service = WEEKLY_SERVICES.find(s => s.dayOfWeek === dayOfWeek);
    if (service) {
      const [hours, mins] = service.startTime.split(':').map(Number);
      const serviceEnd = service.endTime ? service.endTime.split(':').map(Number) : [hours + 2, 0];
      
      const serviceStartDateTime = setMinutes(setHours(targetDate, hours), mins);
      const serviceEndDateTime = setMinutes(setHours(targetDate, serviceEnd[0]), serviceEnd[1]);

      // If today and service end time has already passed, skip to next service day!
      if (i === 0 && isAfter(now, serviceEndDateTime)) {
        continue;
      }

      const isSunday = dayOfWeek === 0;
      const { title, description } = isSunday
        ? getSundayServiceType(targetDate)
        : { title: service.title, description: service.description };

      return {
        id: `recurring-${title.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
        title,
        event_date: dateStr,
        start_time: service.startTime,
        end_time: service.endTime,
        location: service.location,
        description,
        category: 'recurring',
        is_recurring: true,
      };
    }
  }

  return null;
}

/**
 * Formats a clear, bullet-proof response for service schedule queries.
 */
export function getServiceScheduleInfo(): string {
  const nextService = getNextUpcomingService();
  const nextDateFormatted = nextService ? format(new Date(nextService.event_date), 'EEEE, MMMM d, yyyy') : '';

  return (
    `📅 *RCCG Everflourishing Mega Sanctuary — Service Schedule*:\n\n` +
    `• *TUESDAY*: Digging Deep (Bible Study & Intercession) — *6:00 PM - 7:30 PM*\n` +
    `• *THURSDAY*: Faith Clinic (Miracle Hour & Deliverance) — *6:00 PM - 7:00 PM*\n` +
    `• *SUNDAY*: Sunday Celebration Service — *8:00 AM - 12:00 PM*\n\n` +
    `📌 *Note*: There are *no church services scheduled on Wednesdays or Mondays*.\n\n` +
    (nextService
      ? `👉 *NEXT UPCOMING SERVICE*:\n` +
        `• *${nextService.title}*\n` +
        `• 📆 Date: *${nextDateFormatted}*\n` +
        `• ⏰ Time: *${nextService.start_time} - ${nextService.end_time || ''}*\n` +
        `• 📍 Location: *${nextService.location || 'Main Sanctuary'}*`
      : '')
  );
}

/**
 * Returns merged upcoming events including database custom programs and weekly RCCG services
 */
export function getCombinedUpcomingEvents(customDbEvents: ChurchEvent[] = [], daysAhead: number = 28): ChurchEvent[] {
  const now = new Date();
  const recurringEvents: ChurchEvent[] = [];

  for (let i = 0; i <= daysAhead; i++) {
    const targetDate = addDays(now, i);
    const dayOfWeek = targetDate.getDay();
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    WEEKLY_SERVICES.forEach((service) => {
      if (service.dayOfWeek === dayOfWeek) {
        const [hours, mins] = service.startTime.split(':').map(Number);
        const [endHours, endMins] = (service.endTime || '20:00').split(':').map(Number);
        const serviceEndDateTime = setMinutes(setHours(targetDate, endHours), endMins);

        if (isAfter(serviceEndDateTime, now) || !isSameDay(targetDate, now)) {
          const isSunday = dayOfWeek === 0;
          const { title, description } = isSunday
            ? getSundayServiceType(targetDate)
            : { title: service.title, description: service.description };

          recurringEvents.push({
            id: `recurring-${title.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
            title,
            event_date: dateStr,
            start_time: service.startTime,
            end_time: service.endTime,
            location: service.location,
            description,
            category: 'recurring',
            is_recurring: true,
          });
        }
      }
    });
  }

  const combined: ChurchEvent[] = [];

  // 1. Add all custom events from database (which may override recurring defaults)
  customDbEvents.forEach(dbEv => {
    combined.push({
      ...dbEv,
      is_recurring: false,
    });
  });

  // 2. Add recurring events if there is no custom event on the exact same date
  recurringEvents.forEach((rec) => {
    const exists = combined.some((dbEv) => dbEv.event_date === rec.event_date);
    if (!exists) {
      combined.push(rec);
    }
  });

  // Sort chronologically by date and start_time
  combined.sort((a, b) => {
    const dateA = new Date(`${a.event_date}T${a.start_time || '00:00'}`).getTime();
    const dateB = new Date(`${b.event_date}T${b.start_time || '00:00'}`).getTime();
    return dateA - dateB;
  });

  return combined;
}
