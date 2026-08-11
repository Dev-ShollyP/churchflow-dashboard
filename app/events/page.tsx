'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient, getCurrentStaff } from '@/lib/supabase';
import EmptyState from '@/components/ui/EmptyState';
import {
  Calendar, MapPin, Clock, Sparkles, Plus, Trash2,
  CalendarDays, X, Loader2, CheckCircle, ImagePlus, Image as ImageIcon
} from 'lucide-react';
import { format, parseISO, addDays, isSameDay } from 'date-fns';
import { getCombinedUpcomingEvents } from '@/lib/services';

interface SpecialProgram {
  id: string;
  title: string;
  description?: string;
  flyer_url?: string;
  image_url?: string;
  program_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

const defaultProgramForm = { title: '', description: '', flyer_url: '', program_date: '', end_date: '', image_url: '' };
const defaultEventForm = { title: 'Sunday Celebration Service', description: 'Worship, Word & Breakthrough Session', event_date: '', start_time: '08:00', end_time: '11:30', location: 'Main Sanctuary' };

function getNextWeeklyServices() {
  const today = new Date();
  const services = [];

  const daysUntilSunday = (7 - today.getDay()) % 7;
  const nextSunday = addDays(today, daysUntilSunday === 0 && today.getHours() >= 13 ? 7 : daysUntilSunday);
  const sundayFormatted = format(nextSunday, 'yyyy-MM-dd');

  services.push({
    id: `regular-sunday-${sundayFormatted}`,
    title: 'Sunday Worship & Celebration Service',
    description: 'Join us for an empowering session of praise, worship, and the unadulterated Word of God.',
    event_date: sundayFormatted,
    start_time: '08:00',
    end_time: '11:30',
    location: 'Main Sanctuary',
    is_regular: true,
  });

  const daysUntilTuesday = (9 - today.getDay()) % 7;
  const nextTuesday = addDays(today, daysUntilTuesday === 0 && today.getHours() >= 20 ? 7 : daysUntilTuesday);
  const tuesdayFormatted = format(nextTuesday, 'yyyy-MM-dd');

  services.push({
    id: `regular-tuesday-${tuesdayFormatted}`,
    title: 'Digging Deep (Bible Study & Intercession)',
    description: 'Systematic study of the Scriptures and intensive prayer for spiritual growth.',
    event_date: tuesdayFormatted,
    start_time: '18:00',
    end_time: '19:30',
    location: 'Main Sanctuary',
    is_regular: true,
  });

  const daysUntilThursday = (11 - today.getDay()) % 7;
  const nextThursday = addDays(today, daysUntilThursday === 0 && today.getHours() >= 20 ? 7 : daysUntilThursday);
  const thursdayFormatted = format(nextThursday, 'yyyy-MM-dd');

  services.push({
    id: `regular-thursday-${thursdayFormatted}`,
    title: 'Faith Clinic (Miracle Hour)',
    description: 'A powerful hour of faith, healing, deliverance, and prophetic declarations.',
    event_date: thursdayFormatted,
    start_time: '18:00',
    end_time: '19:00',
    location: 'Main Sanctuary',
    is_regular: true,
  });

  return services;
}

export default function EventsPage() {
  const [tab, setTab] = useState<'events' | 'programs'>('events');

  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [savingEvent, setSavingEvent] = useState(false);

  const [programs, setPrograms] = useState<SpecialProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultProgramForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadEvents();
    getCurrentStaff().then(s => { if (s) setCanWrite(true); });
  }, []);

  useEffect(() => {
    if (tab === 'programs' && programs.length === 0 && !programsLoading) {
      loadPrograms();
    }
  }, [tab]);

  async function loadEvents() {
    setEventsLoading(true);
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const { data } = await supabase
      .from('events')
      .select('id, title, description, event_date, start_time, end_time, location')
      .gte('event_date', localToday)
      .order('event_date', { ascending: true })
      .limit(50);

    const fetched = data ?? [];
    const combined = getCombinedUpcomingEvents(fetched, 21);
    setEvents(combined);

    setEventsLoading(false);
  }

  async function loadPrograms() {
    setProgramsLoading(true);
    const { data } = await supabase
      .from('special_programs')
      .select('*')
      .order('created_at', { ascending: false });
    setPrograms(data ?? []);
    setProgramsLoading(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleAddEvent() {
    if (!eventForm.title.trim() || !eventForm.event_date) return;
    setSavingEvent(true);

    try {
      const { error } = await supabase.from('events').insert({
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || null,
        event_date: eventForm.event_date,
        start_time: eventForm.start_time || '08:00',
        end_time: eventForm.end_time || '11:30',
        location: eventForm.location.trim() || 'Main Sanctuary',
      });

      if (error) throw error;

      showToast('success', 'Event created successfully!');
      setShowEventModal(false);
      setEventForm(defaultEventForm);
      loadEvents();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to create event.');
    } finally {
      setSavingEvent(false);
    }
  }

  const [sendBroadcast, setSendBroadcast] = useState(true);

  async function handleAddProgram() {
    if (!form.title.trim()) return;
    setSaving(true);

    let uploadedImageUrl = '';
    if (imageFile) {
      try {
        const ext = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `Special Programs/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('Flyers')
          .upload(filePath, imageFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('Flyers').getPublicUrl(filePath);
          uploadedImageUrl = urlData.publicUrl;
        }
      } catch {}
    }

    const { data: programData, error } = await supabase.from('special_programs').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      flyer_url: form.flyer_url.trim() || null,
      image_url: uploadedImageUrl || null,
      program_date: form.program_date || null,
      end_date: form.end_date || null,
      is_active: true,
    }).select().single();

    if (error) {
      setSaving(false);
      showToast('error', error.message);
      return;
    }

    // Trigger WhatsApp Broadcast Reminder via /api/programs/notify
    if (sendBroadcast) {
      try {
        await fetch('/api/programs/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: programData?.id,
            title: form.title.trim(),
            description: form.description.trim(),
            program_date: form.program_date,
            end_date: form.end_date,
            image_url: uploadedImageUrl || form.flyer_url,
            send_broadcast: true,
          }),
        });
      } catch (notifyErr) {
        console.error('Failed to dispatch broadcast notification:', notifyErr);
      }
    }

    setSaving(false);
    showToast('success', sendBroadcast ? 'Special Program created & WhatsApp broadcast queued!' : 'Special Program created!');
    setShowModal(false);
    setForm(defaultProgramForm);
    setImageFile(null);
    setImagePreview(null);
    loadPrograms();
  }

  async function handleDeleteProgram(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from('special_programs').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', 'Special Program deleted.');
      setPrograms(prev => prev.filter(p => p.id !== id));
    }
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <DashboardShell>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2 text-xs font-semibold animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-red-950/90 text-red-300 border-red-500/40'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">Events & Programs</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            {tab === 'events'
              ? `${events.length} upcoming church services & events`
              : `${programs.filter(p => p.is_active).length} active special programs`}
          </p>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            {tab === 'events' ? (
              <button
                onClick={() => {
                  const tomorrow = addDays(new Date(), 1);
                  setEventForm({ ...defaultEventForm, event_date: format(tomorrow, 'yyyy-MM-dd') });
                  setShowEventModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold btn-gold shadow-gold"
              >
                <Plus size={16} />
                Add Event
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold btn-gold shadow-gold"
              >
                <Plus size={16} />
                Add Program
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-full sm:w-fit glass-card">
        <button
          onClick={() => setTab('events')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex-1 sm:flex-none whitespace-nowrap ${
            tab === 'events' ? 'btn-gold shadow-gold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Calendar size={15} />
          Upcoming Events
        </button>
        <button
          onClick={() => setTab('programs')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex-1 sm:flex-none whitespace-nowrap ${
            tab === 'programs' ? 'btn-gold shadow-gold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Sparkles size={15} />
          Special Programs
        </button>
      </div>

      {/* EVENTS TAB */}
      {tab === 'events' && (
        <>
          {eventsLoading ? (
            <div className="glass-card p-10 text-center text-white/40 text-sm">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <EmptyState icon={Calendar} title="No upcoming events" description="Click '+ Add Event' to schedule new services." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {events.map((event: any, idx: number) => {
                const eventDateObj = parseISO(event.event_date);
                const isTomorrow = isSameDay(eventDateObj, addDays(new Date(), 1));
                const isToday = isSameDay(eventDateObj, new Date());

                return (
                  <div
                    key={event.id}
                    className={`glass-card p-5 animate-slide-up border transition-all ${
                      isTomorrow || isToday ? 'border-gold/40 shadow-gold' : 'border-white/10'
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ background: 'oklch(0.78 0.16 75 / 0.14)', border: '1px solid oklch(0.78 0.16 75 / 0.25)' }}
                        >
                          <span className="text-lg font-bold leading-none text-gold">
                            {format(eventDateObj, 'd')}
                          </span>
                          <span className="text-[9px] uppercase font-semibold leading-none text-gold/70 mt-0.5">
                            {format(eventDateObj, 'MMM')}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-display font-bold text-white text-base leading-snug">{event.title}</h3>
                          <p className="text-[11px] text-white/40">{format(eventDateObj, 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                      </div>

                      {isToday && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          TODAY
                        </span>
                      )}
                      {isTomorrow && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/20 text-gold border border-gold/30">
                          TOMORROW
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-xs text-white/70 mb-4 line-clamp-2 leading-relaxed p-3 rounded-xl bg-black/40 border border-white/5">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs text-white/50 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-gold flex-shrink-0" />
                        <span>
                          {event.start_time || '08:00'}
                          {event.end_time ? ` - ${event.end_time}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-gold flex-shrink-0" />
                        <span className="truncate">{event.location || 'Main Sanctuary'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SPECIAL PROGRAMS TAB */}
      {tab === 'programs' && (
        <>
          {programsLoading ? (
            <div className="glass-card p-10 text-center text-white/40 text-sm">Loading Special Programs...</div>
          ) : programs.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <EmptyState icon={Sparkles} title="No special programs listed" description="Special programs are for non-regular events. Click '+ Add Program' to post one." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {programs.map((prog, idx) => (
                <div
                  key={prog.id}
                  className="glass-card overflow-hidden flex flex-col justify-between animate-slide-up group border border-white/10 hover:border-gold/40 transition-all"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div>
                    {prog.image_url ? (
                      <div className="relative w-full h-44 overflow-hidden bg-black/50">
                        <img
                          src={prog.image_url}
                          alt={prog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                      </div>
                    ) : prog.flyer_url ? (
                      <div className="relative w-full h-44 overflow-hidden bg-black/50 flex items-center justify-center border-b border-white/5">
                        <img
                          src={prog.flyer_url}
                          alt={prog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent flex items-center justify-center border-b border-white/5">
                        <Sparkles size={24} className="text-gold/40" />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-bold text-white text-base sm:text-lg leading-snug">{prog.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                          prog.is_active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-white/40'
                        }`}>
                          {prog.is_active ? 'Active' : 'Archived'}
                        </span>
                      </div>

                      {prog.description && (
                        <p className="text-xs text-white/70 mb-4 line-clamp-3 leading-relaxed">{prog.description}</p>
                      )}

                      <div className="space-y-1.5 text-xs text-white/50 pt-2 border-t border-white/10">
                        {prog.program_date && (
                          <div className="flex items-center gap-2">
                            <CalendarDays size={13} className="text-gold flex-shrink-0" />
                            <span>
                              {format(parseISO(prog.program_date), 'MMM d, yyyy')}
                              {prog.end_date ? ` - ${format(parseISO(prog.end_date), 'MMM d, yyyy')}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {canWrite && (
                    <div className="px-5 py-3 bg-black/40 border-t border-white/5 flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteProgram(prog.id)}
                        disabled={deletingId === prog.id}
                        className="text-xs text-red-400/80 hover:text-red-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-500/10"
                      >
                        {deletingId === prog.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 space-y-4 animate-popover border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-semibold text-white text-base">Schedule New Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1 font-semibold">Event / Service Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Sunday Worship Celebration"
                  className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1 font-semibold">Event Date *</label>
                  <input
                    type="date"
                    value={eventForm.event_date}
                    onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1 font-semibold">Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="Main Sanctuary"
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1 font-semibold">Start Time</label>
                  <input
                    type="time"
                    value={eventForm.start_time}
                    onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1 font-semibold">End Time</label>
                  <input
                    type="time"
                    value={eventForm.end_time}
                    onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Service details, guest ministers, theme, etc..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button onClick={() => setShowEventModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold btn-glass">Cancel</button>
              <button onClick={handleAddEvent} disabled={savingEvent} className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5">
                {savingEvent ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {savingEvent ? 'Saving...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Program Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 space-y-4 animate-popover border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-semibold text-white text-base">Post Special Program</h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1 font-semibold">Program Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual Convention / Youth Praise Night"
                  className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-semibold">Program Image / Flyer Upload</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-white/15 hover:border-gold/50 bg-black/40 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <ImagePlus size={20} className="mx-auto text-gold mb-1" />
                      <p className="text-white/60 text-[11px] font-medium">Click to upload flyer image</p>
                      <p className="text-white/30 text-[9px]">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={form.program_date}
                    onChange={e => setForm({ ...form, program_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Program details, theme, ministers, venue..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>

              {/* Broadcast Toggle */}
              <div className="p-3 rounded-xl bg-navy-dark/70 border border-gold/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-gold flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">Broadcast WhatsApp Reminder</p>
                    <p className="text-[10px] text-white/40">Automatically send broadcast reminders to members via n8n pipeline</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={sendBroadcast}
                  onChange={(e) => setSendBroadcast(e.target.checked)}
                  className="w-4 h-4 accent-gold rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold btn-glass">Cancel</button>
              <button onClick={handleAddProgram} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? 'Posting...' : 'Post Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
