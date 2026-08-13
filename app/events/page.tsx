'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient, getCurrentStaff, getBranchId } from '@/lib/supabase';
import EmptyState from '@/components/ui/EmptyState';
import {
  Calendar, MapPin, Clock, Sparkles, Plus, Trash2, Edit3,
  CalendarDays, X, Loader2, CheckCircle, ImagePlus, Eye, BookOpen
} from 'lucide-react';
import { format, parseISO, addDays, isSameDay } from 'date-fns';
import { getCombinedUpcomingEvents, ChurchEvent } from '@/lib/services';

const DEFAULT_BRANCH_ID = '22222222-2222-2222-2222-222222222222';
const STORAGE_BASE = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers';

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
const defaultEventForm = {
  id: '',
  title: 'Sunday Worship Celebration',
  scripture: '',
  description: 'Worship, Word & Breakthrough Session',
  event_date: '',
  start_time: '08:00',
  end_time: '11:30',
  location: 'Main Sanctuary',
  image_url: '',
};

/**
 * Helper to parse embedded metadata tags from description string if columns are missing in DB
 */
function parseEventMeta(rawDescription?: string | null): { cleanDescription: string; embeddedFlyer?: string; embeddedScripture?: string } {
  if (!rawDescription) return { cleanDescription: '' };
  
  let cleanDescription = rawDescription;
  let embeddedFlyer: string | undefined = undefined;
  let embeddedScripture: string | undefined = undefined;

  const flyerMatch = cleanDescription.match(/\[FLYER:\s*([^\]]+)\]/);
  if (flyerMatch) {
    embeddedFlyer = flyerMatch[1].trim();
    cleanDescription = cleanDescription.replace(/\[FLYER:\s*[^\]]+\]/g, '').trim();
  }

  const scriptMatch = cleanDescription.match(/\[SCRIPTURE:\s*([^\]]+)\]/);
  if (scriptMatch) {
    embeddedScripture = scriptMatch[1].trim();
    cleanDescription = cleanDescription.replace(/\[SCRIPTURE:\s*[^\]]+\]/g, '').trim();
  }

  return { cleanDescription, embeddedFlyer, embeddedScripture };
}

export default function EventsPage() {
  const [tab, setTab] = useState<'events' | 'programs'>('events');

  // Events State
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Special Programs State
  const [programs, setPrograms] = useState<SpecialProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultProgramForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendBroadcast, setSendBroadcast] = useState(true);

  // Full Flyer Viewer Modal State
  const [selectedFlyer, setSelectedFlyer] = useState<{ title: string; image_url: string; date?: string; scripture?: string } | null>(null);

  const [canWrite, setCanWrite] = useState(false);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadEvents();
    getBranchId().then(b => { if (b) setBranchId(b); });
    getCurrentStaff().then(s => {
      if (s) {
        setCanWrite(true);
        if (s.branch_id) setBranchId(s.branch_id);
      }
    });
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
    
    // Query events with actual database columns (banner_url)
    const { data } = await supabase
      .from('events')
      .select('id, branch_id, title, description, event_date, start_time, end_time, location, banner_url')
      .gte('event_date', localToday)
      .order('event_date', { ascending: true })
      .limit(50);

    const fetched = (data ?? []).map((item: any) => {
      const { cleanDescription, embeddedFlyer, embeddedScripture } = parseEventMeta(item.description);
      return {
        ...item,
        description: cleanDescription,
        image_url: item.banner_url || item.image_url || item.flyer_url || embeddedFlyer,
        scripture: item.scripture || embeddedScripture,
      };
    });

    const combined = getCombinedUpcomingEvents(fetched, 28);
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

  function handleEventImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEventImageFile(file);
    setEventImagePreview(URL.createObjectURL(file));
  }

  function handleOpenNewEventModal() {
    const tomorrow = addDays(new Date(), 1);
    setEditingEvent(null);
    setEventForm({ ...defaultEventForm, event_date: format(tomorrow, 'yyyy-MM-dd') });
    setEventImageFile(null);
    setEventImagePreview(null);
    setShowEventModal(true);
  }

  function handleOpenEditEventModal(event: ChurchEvent) {
    const { cleanDescription, embeddedFlyer, embeddedScripture } = parseEventMeta(event.description);
    
    // Default fallback flyer depending on title if none set
    let flyerUrl = (event as any).banner_url || event.image_url || event.flyer_url || embeddedFlyer || '';
    if (!flyerUrl) {
      const titleLower = event.title.toLowerCase();
      if (titleLower.includes('thanksgiving')) flyerUrl = STORAGE_BASE + '/Service/Thanks.jpg';
      else if (titleLower.includes('digging')) flyerUrl = STORAGE_BASE + '/Service/Digging%20Deep.png';
      else if (titleLower.includes('faith')) flyerUrl = STORAGE_BASE + '/Service/faith%20clinic.jpg';
      else if (titleLower.includes('youth') || titleLower.includes('super sunday') || titleLower.includes('prayer sunday')) flyerUrl = STORAGE_BASE + '/Service/First%20Service.jpg';
    }

    setEditingEvent(event);
    setEventForm({
      id: event.id.startsWith('recurring-') ? '' : event.id,
      title: event.title,
      scripture: (event as any).scripture || embeddedScripture || '',
      description: cleanDescription || '',
      event_date: event.event_date,
      start_time: event.start_time || '08:00',
      end_time: event.end_time || '11:30',
      location: event.location || 'Main Sanctuary',
      image_url: flyerUrl,
    });
    setEventImageFile(null);
    setEventImagePreview(flyerUrl || null);
    setShowEventModal(true);
  }

  async function handleSaveEvent() {
    if (!eventForm.title.trim() || !eventForm.event_date) return;
    setSavingEvent(true);

    try {
      let uploadedImageUrl = eventForm.image_url;

      if (eventImageFile) {
        try {
          const apiFormData = new FormData();
          apiFormData.append('file', eventImageFile);
          const res = await fetch('/api/events/upload', { method: 'POST', body: apiFormData });
          const json = await res.json();
          if (json.publicUrl) {
            uploadedImageUrl = json.publicUrl;
          } else {
            console.warn('API upload error fallback:', json.error);
          }
        } catch (e) {
          console.error('File upload error:', e);
        }
      }

      // Encode flyer URL and scripture reference safely inside description
      let compositeDescription = eventForm.description.trim();
      if (uploadedImageUrl) {
        compositeDescription += `\n[FLYER:${uploadedImageUrl}]`;
      }
      if (eventForm.scripture.trim()) {
        compositeDescription += `\n[SCRIPTURE:${eventForm.scripture.trim()}]`;
      }

      // Resolve valid branch_id (REQUIRED NOT NULL foreign key)
      let activeBranchId = branchId;
      if (!activeBranchId) {
        const { data: sess } = await supabase.from('whatsapp_sessions').select('branch_id').limit(1).single();
        activeBranchId = sess?.branch_id || DEFAULT_BRANCH_ID;
      }

      // Match actual Postgres schema columns (banner_url, branch_id)
      const payload: any = {
        branch_id: activeBranchId || DEFAULT_BRANCH_ID,
        title: eventForm.title.trim(),
        description: compositeDescription || null,
        event_date: eventForm.event_date,
        start_time: eventForm.start_time || '08:00',
        end_time: eventForm.end_time || '11:30',
        location: eventForm.location.trim() || 'Main Sanctuary',
        banner_url: uploadedImageUrl || null,
      };

      if (eventForm.id) {
        payload.id = eventForm.id;
      }

      const { error } = await supabase.from('events').upsert(payload).select();
      if (error) throw error;

      showToast('success', editingEvent ? 'Event updated with flyer design & scripture!' : 'Event created successfully!');
      setShowEventModal(false);
      setEditingEvent(null);
      setEventForm(defaultEventForm);
      setEventImageFile(null);
      setEventImagePreview(null);
      loadEvents();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save event.');
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (eventId.startsWith('recurring-')) return;
    setDeletingEventId(eventId);
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    setDeletingEventId(null);
    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', 'Custom event deleted.');
      loadEvents();
    }
  }

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
        } else {
          uploadedImageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(imageFile);
          });
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">Events &amp; Programs</h1>
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
                onClick={handleOpenNewEventModal}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map((event: ChurchEvent, idx: number) => {
                const eventDateObj = parseISO(event.event_date);
                const isTomorrow = isSameDay(eventDateObj, addDays(new Date(), 1));
                const isToday = isSameDay(eventDateObj, new Date());
                const { cleanDescription, embeddedFlyer, embeddedScripture } = parseEventMeta(event.description);
                const scriptureText = (event as any).scripture || embeddedScripture;
                const flyerSrc = (event as any).banner_url || event.image_url || event.flyer_url || embeddedFlyer || '';
                const hasFlyer = !!flyerSrc;

                return (
                  <div
                    key={event.id}
                    className={`glass-card overflow-hidden flex flex-col justify-between animate-slide-up border transition-all group ${
                      isTomorrow || isToday ? 'border-gold/50 shadow-gold' : 'border-white/10 hover:border-gold/30'
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div>
                      {/* Banner Flyer Image Header if attached */}
                      {hasFlyer ? (
                        <div
                          onClick={() => setSelectedFlyer({ title: event.title, image_url: flyerSrc, date: format(eventDateObj, 'EEEE, MMMM d, yyyy'), scripture: scriptureText })}
                          className="relative w-full h-48 overflow-hidden bg-black/60 cursor-pointer border-b border-white/10 group-hover:opacity-95 transition-opacity"
                        >
                          <img
                            src={flyerSrc}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent opacity-80" />
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-gold border border-gold/40 flex items-center gap-1">
                            <Eye size={12} /> View Flyer Design
                          </div>
                        </div>
                      ) : null}

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
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

                          <div className="flex flex-col items-end gap-1">
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
                        </div>

                        {/* Scripture Reference Pill */}
                        {scriptureText && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold/10 border border-gold/25 text-gold text-[11px] font-medium my-2">
                            <BookOpen size={12} className="text-gold" />
                            <span>📖 {scriptureText}</span>
                          </div>
                        )}

                        {cleanDescription && (
                          <p className="text-xs text-white/70 mb-4 line-clamp-3 leading-relaxed p-3 rounded-xl bg-black/40 border border-white/5 mt-1">
                            {cleanDescription}
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
                    </div>

                    {/* Card Action Controls */}
                    {canWrite && (
                      <div className="px-5 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenEditEventModal(event)}
                          className="text-xs text-gold/90 hover:text-gold font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 border border-gold/30"
                        >
                          <Edit3 size={13} />
                          {hasFlyer ? 'Edit Event / Flyer' : 'Attach Flyer / Edit'}
                        </button>

                        {!event.id.startsWith('recurring-') && (
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deletingEventId === event.id}
                            className="text-xs text-red-400/80 hover:text-red-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                          >
                            {deletingEventId === event.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Delete
                          </button>
                        )}
                      </div>
                    )}
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
                      <div
                        onClick={() => setSelectedFlyer({ title: prog.title, image_url: prog.image_url! })}
                        className="relative w-full h-44 overflow-hidden bg-black/50 cursor-pointer"
                      >
                        <img
                          src={prog.image_url}
                          alt={prog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                      </div>
                    ) : prog.flyer_url ? (
                      <div
                        onClick={() => setSelectedFlyer({ title: prog.title, image_url: prog.flyer_url! })}
                        className="relative w-full h-44 overflow-hidden bg-black/50 flex items-center justify-center border-b border-white/5 cursor-pointer"
                      >
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

      {/* Create / Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 space-y-4 animate-popover border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-semibold text-white text-base">
                {editingEvent ? `Edit Event & Attach Flyer Design` : `Schedule New Event`}
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1 font-semibold">Event / Service Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. 3rd Sunday — Youth Sunday / Mountains Be Removed"
                  className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>

              {/* Scripture Reference Input */}
              <div>
                <label className="block text-white/60 mb-1 font-semibold flex items-center gap-1 text-gold/90">
                  <BookOpen size={13} /> Scripture Reference / Theme Verse
                </label>
                <input
                  type="text"
                  value={eventForm.scripture}
                  onChange={e => setEventForm({ ...eventForm, scripture: e.target.value })}
                  placeholder="e.g. Mark 11:23, 1 Cor 10:31, Psalm 23:1"
                  className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>

              {/* Event Flyer Design Image Upload */}
              <div>
                <label className="block text-white/60 mb-1 font-semibold">Event Flyer Graphic / Design</label>
                <div
                  onClick={() => eventFileInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-white/15 hover:border-gold/50 bg-black/40 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group"
                >
                  {eventImagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={eventImagePreview} alt="Flyer Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                        Click to Change Flyer Image
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3">
                      <ImagePlus size={22} className="mx-auto text-gold mb-1" />
                      <p className="text-white/80 text-xs font-medium">Click to upload Event Flyer Design</p>
                      <p className="text-white/30 text-[10px] mt-0.5">PNG, JPG, WEBP graphic design</p>
                    </div>
                  )}
                  <input
                    ref={eventFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEventImageChange}
                    className="hidden"
                  />
                </div>
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
                <label className="block text-white/60 mb-1 font-semibold">Description &amp; Theme</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Service Theme, Guest Ministers, Details..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/40 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button onClick={() => setShowEventModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold btn-glass">Cancel</button>
              <button onClick={handleSaveEvent} disabled={savingEvent} className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5">
                {savingEvent ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {savingEvent ? 'Saving Event...' : editingEvent ? 'Update Event & Flyer' : 'Create Event'}
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

      {/* Full Flyer Image Modal Viewer */}
      {selectedFlyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-2xl overflow-hidden rounded-2xl border border-gold/40 shadow-2xl flex flex-col max-h-[90vh] animate-popover">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-navy-dark/80">
              <div>
                <h3 className="font-display font-bold text-white text-base">{selectedFlyer.title}</h3>
                {selectedFlyer.scripture && (
                  <p className="text-xs text-gold/90 font-medium">📖 {selectedFlyer.scripture}</p>
                )}
                {selectedFlyer.date && <p className="text-xs text-white/40">{selectedFlyer.date}</p>}
              </div>
              <button onClick={() => setSelectedFlyer(null)} className="text-white/40 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 bg-black/90 flex items-center justify-center">
              <img
                src={selectedFlyer.image_url}
                alt={selectedFlyer.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="p-4 border-t border-white/10 bg-navy-dark/80 flex items-center justify-between">
              <span className="text-xs text-white/40">RCCG Everflourishing Sanctuary</span>
              <a
                href={selectedFlyer.image_url}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5"
              >
                Download Flyer Design
              </a>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
