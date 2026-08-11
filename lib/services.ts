import { addDays, format, isAfter, isSameDay, setHours, setMinutes, getDate } from 'date-fns';

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
}

/**
 * Determines the RCCG Sunday service type by week-of-month.
 * 1st Sunday → Thanksgiving Service
 * 2nd Sunday → Prayer Sunday
 * 3rd Sunday → Youth Sunday
 * 4th Sunday → Super Sunday (Relationship Sunday)
 * 5th Sunday → CSR / Welfare Sunday
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

const WEEKLY_SERVICES = [
  {
    dayOfWeek: 2, // Tuesday
    title: 'Digging Deep (Bible Study)',
    startTime: '18:00',
    endTime: '19:30',
    location: 'Main Sanctuary',
    description: 'Bilingual Word Study & Spiritual Growth Service',
  },
  {
    dayOfWeek: 4, // Thursday
    title: 'Faith Clinic (Prayer & Deliverance)',
    startTime: '18:00',
    endTime: '19:00',
    location: 'Main Sanctuary',
    description: 'Intercession, Divine Healing & Deliverance Service',
  },
  {
    dayOfWeek: 0, // Sunday — title & description resolved dynamically
    title: '',
    startTime: '08:00',
    endTime: '12:00',
    location: 'Main Sanctuary',
    description: '',
  },
];

/**
 * Returns the single next upcoming service from today onward (first match within 14 days).
 * Prefers a custom DB event on the same day, otherwise returns the recurring weekly service.
 */
export function getNextUpcomingService(customDbEvents: ChurchEvent[] = []): ChurchEvent | null {
  const now = new Date();

  for (let i = 0; i <= 14; i++) {
    const targetDate = addDays(now, i);
    const dayOfWeek = targetDate.getDay();
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    // Check if custom DB event exists on this date
    const customOnDate = customDbEvents.find(ev => ev.event_date === dateStr);
    if (customOnDate) return customOnDate;

    // Check if a weekly service falls on this day
    const service = WEEKLY_SERVICES.find(s => s.dayOfWeek === dayOfWeek);
    if (service) {
      const [hours, mins] = service.startTime.split(':').map(Number);
      const serviceDateTime = new Date(targetDate);
      serviceDateTime.setHours(hours, mins, 0, 0);

      // Skip if today's service has already passed
      if (i === 0 && !isAfter(serviceDateTime, now)) continue;

      // For Sundays, get the dynamic service type
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
 * Returns merged upcoming events including both database custom programs and next weekly RCCG services
 */
export function getCombinedUpcomingEvents(customDbEvents: ChurchEvent[] = [], daysAhead: number = 14): ChurchEvent[] {
  const now = new Date();

  const recurringEvents: ChurchEvent[] = [];

  // Generate next occurrences of weekly services for the next N days
  for (let i = 0; i <= daysAhead; i++) {
    const targetDate = addDays(now, i);
    const dayOfWeek = targetDate.getDay();
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    WEEKLY_SERVICES.forEach((service) => {
      if (service.dayOfWeek === dayOfWeek) {
        // If it's today, check if start_time has already passed
        const [hours, mins] = service.startTime.split(':').map(Number);
        const serviceDateTime = setMinutes(setHours(targetDate, hours), mins);

        if (isAfter(serviceDateTime, now) || isSameDay(targetDate, now)) {
          // For Sundays, resolve dynamic service type
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

  // Combine custom DB events and recurring weekly services
  const combined = [...customDbEvents];
  
  // Only add recurring service if there is no custom event on the exact same date with same/similar title
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
