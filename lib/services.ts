import { addDays, format, isAfter, isSameDay, setHours, setMinutes, getDate, getDay } from 'date-fns';

const STORAGE_BASE = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers';

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
  scripture?: string;
}

/**
 * Determines the RCCG Sunday service type by week-of-month and assigns default flyer.
 */
function getSundayServiceType(date: Date): { title: string; description: string; flyerUrl: string } {
  const dayOfMonth = getDate(date); // 1–31
  const weekOfMonth = Math.ceil(dayOfMonth / 7); // 1–5

  switch (weekOfMonth) {
    case 1:
      return {
        title: '1st Sunday — Thanksgiving Service',
        description: 'Glorious Celebration: Praise, Worship & Thanksgiving Offering',
        flyerUrl: STORAGE_BASE + '/Service/Thanks.jpg',
      };
    case 2:
      return {
        title: '2nd Sunday — Prayer Sunday',
        description: 'Glorious Celebration: Corporate Intercessory Prayer & Word Service',
        flyerUrl: STORAGE_BASE + '/Service/Second%20Servivce.jpg',
      };
    case 3:
      return {
        title: '3rd Sunday — Youth Sunday',
        description: 'Glorious Celebration: Youth-Led Praise, Worship & Word Service',
        flyerUrl: STORAGE_BASE + '/Service/First%20Service.jpg',
      };
    case 4:
      return {
        title: '4th Sunday — Super Sunday (Relationship Sunday)',
        description: 'Glorious Celebration: Marriage, Family & Relationship Ministry Service',
        flyerUrl: STORAGE_BASE + '/Service/First%20Service.jpg',
      };
    case 5:
    default:
      return {
        title: '5th Sunday — CSR / Welfare Sunday',
        description: 'Glorious Celebration: Community Service & Welfare Outreach Service',
        flyerUrl: STORAGE_BASE + '/Service/First%20Service.jpg',
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
    flyerUrl: STORAGE_BASE + '/Service/Digging%20Deep.png',
  },
  {
    dayOfWeek: 4, // Thursday
    dayName: 'Thursday',
    title: 'Faith Clinic (Prayer & Deliverance)',
    startTime: '18:00',
    endTime: '19:00',
    location: 'Main Sanctuary',
    description: 'Intercession, Divine Healing & Deliverance Service',
    flyerUrl: STORAGE_BASE + '/Service/Faith%20Clinic.jpeg',
  },
  {
    dayOfWeek: 0, // Sunday
    dayName: 'Sunday',
    title: 'Sunday Worship Service',
    startTime: '08:00',
    endTime: '12:00',
    location: 'Main Sanctuary',
    description: 'Worship, Word & Breakthrough Session',
    flyerUrl: STORAGE_BASE + '/Service/First%20Service.jpg',
  },
];

/**
 * Returns the single next upcoming service from today onward.
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

      if (i === 0 && isAfter(now, serviceEndDateTime)) {
        continue;
      }

      const isSunday = dayOfWeek === 0;
      const { title, description, flyerUrl } = isSunday
        ? getSundayServiceType(targetDate)
        : { title: service.title, description: service.description, flyerUrl: service.flyerUrl };

      return {
        id: `recurring-${title.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
        title,
        event_date: dateStr,
        start_time: service.startTime,
        end_time: service.endTime,
        location: service.location,
        description,
        image_url: flyerUrl,
        flyer_url: flyerUrl,
        category: 'recurring',
        is_recurring: true,
      };
    }

    // Check Monthly Youth Vigil (Last Wednesday)
    if (dayOfWeek === 3) {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const diff = (lastDayOfMonth.getDay() - 3 + 7) % 7;
      const lastWedDay = lastDayOfMonth.getDate() - diff;

      if (targetDate.getDate() === lastWedDay) {
        const vigilEnd = setMinutes(setHours(addDays(targetDate, 1), 4), 0);
        if (i > 0 || isAfter(vigilEnd, now)) {
          return {
            id: `recurring-youth-vigil-${dateStr}`,
            title: 'Youth Vigil (YAYA Vigil)',
            event_date: dateStr,
            start_time: '23:00',
            end_time: '04:00',
            location: 'Main Sanctuary',
            description: 'Night of Supernatural Encounter, Worship, Intercession & Spiritual Fire',
            image_url: STORAGE_BASE + '/Service/Youth%20vigil.jpg',
            flyer_url: STORAGE_BASE + '/Service/Youth%20vigil.jpg',
            category: 'recurring',
            is_recurring: true,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Formats a clear response for service schedule queries.
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
          const { title, description, flyerUrl } = isSunday
            ? getSundayServiceType(targetDate)
            : { title: service.title, description: service.description, flyerUrl: service.flyerUrl };

          recurringEvents.push({
            id: `recurring-${title.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
            title,
            event_date: dateStr,
            start_time: service.startTime,
            end_time: service.endTime,
            location: service.location,
            description,
            image_url: flyerUrl,
            flyer_url: flyerUrl,
            category: 'recurring',
            is_recurring: true,
          });
        }
      }
    });

    // Monthly Youth Vigil (YAYA Vigil) on the Last Wednesday of the month
    if (dayOfWeek === 3) {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const diff = (lastDayOfMonth.getDay() - 3 + 7) % 7;
      const lastWedDay = lastDayOfMonth.getDate() - diff;

      if (targetDate.getDate() === lastWedDay) {
        const vigilEnd = setMinutes(setHours(addDays(targetDate, 1), 4), 0);
        if (isAfter(vigilEnd, now) || !isSameDay(targetDate, now)) {
          recurringEvents.push({
            id: `recurring-youth-vigil-${dateStr}`,
            title: 'Youth Vigil (YAYA Vigil)',
            event_date: dateStr,
            start_time: '23:00',
            end_time: '04:00',
            location: 'Main Sanctuary',
            description: 'Night of Supernatural Encounter, Worship, Intercession & Spiritual Fire',
            image_url: STORAGE_BASE + '/Service/Youth%20vigil.jpg',
            flyer_url: STORAGE_BASE + '/Service/Youth%20vigil.jpg',
            category: 'recurring',
            is_recurring: true,
          });
        }
      }
    }
  }

  const combined: ChurchEvent[] = [];

  // 1. Add all custom events from database
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
