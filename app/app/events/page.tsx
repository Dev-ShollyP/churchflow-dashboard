'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient, getCurrentStaff } from '@/lib/supabase';
import EmptyState from '@/components/ui/EmptyState';
import {
  Calendar, MapPin, Clock, Sparkles, Plus, Trash2,
  CalendarDays, Link2, FileText, X, Loader2, CheckCircle, ImagePlus, Image as ImageIcon
} from 'lucide-react';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';

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

const defaultForm = { title: '', description: '', flyer_url: '', program_date: '', end_date: '', image_url: '' };

export default function EventsPage() {
  const [tab, setTab] = useState<'events' | 'programs'>('events');

  // Events state
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Special Programs state
  const [programs, setPrograms] = useState<SpecialProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
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
    setEvents(data ?? []);
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

  async function handleAddProgram() {
    if (!form.title.trim()) return;
    setSaving(true);
    const staff = await getCurrentStaff();

    let uploadedImageUrl = '';
    // Upload image to Supabase Storage if selected
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

    const { error } = await supabase.from('special_programs').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      flyer_url: form.flyer_url.trim() || null,
      image_url: uploadedImageUrl || null,
      program_date: form.program_date || null,
      end_date: form.end_date || null,
      is_active: true,
      created_by: staff?.full_name || staff?.email || 'staff',
    });
    setSaving(false);
    if (error) {
      showToast('error', error.message);
    } else {
      showToast('success', `"${form.title}" added!`);
      setForm(defaultForm);
      setImageFile(null);
      setImagePreview(null);
      setShowModal(false);
      loadPrograms();
    }
  }

  async function handleDeleteProgram(id: string, title: string) {
    if (!confirm(`Remove "${title}"?`)) return;
    setDeletingId(id);
    await supabase.from('special_programs').delete().eq('id', id);
    setDeletingId(null);
    showToast('success', `"${title}" removed.`);
    loadPrograms();
  }

  async function handleToggleActive(prog: SpecialProgram) {
    await supabase.from('special_programs').update({ is_active: !prog.is_active }).eq('id', prog.id);
    loadPrograms();
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const today = startOfDay(new Date());
  const upcoming = events.filter((e: any) =>
    isAfter(parseISO(e.event_date), today) || parseISO(e.event_date).getTime() === today.getTime()
  ).length;

  return (
    <DashboardShell>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-slide-up
          ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
          <CheckCircle size={15} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 sm:gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-white mb-0.5">Events &amp; Programs</h1>
          <p className="text-xs text-white/40">
            {tab === 'events'
              ? (eventsLoading ? 'Loading...' : `${upcoming} upcoming · ${events.length} total`)
              : `Manage special church programs shown on the WhatsApp bot`
            }
          </p>
        </div>
        {tab === 'programs' && canWrite && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', color: '#0A0E1A', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}
          >
            <Plus size={16} />
            Add Program
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-full sm:w-fit overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => setTab('events')}
          className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none whitespace-nowrap ${
            tab === 'events'
              ? 'text-white'
              : 'text-white/40 hover:text-white/70'
          }`}
          style={tab === 'events' ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)' } : {}}
        >
          <Calendar size={14} className={tab === 'events' ? 'text-gold' : ''} />
          Upcoming Events
        </button>
        <button
          onClick={() => setTab('programs')}
          className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none whitespace-nowrap ${
            tab === 'programs'
              ? 'text-white'
              : 'text-white/40 hover:text-white/70'
          }`}
          style={tab === 'programs' ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)' } : {}}
        >
          <Sparkles size={14} className={tab === 'programs' ? 'text-gold' : ''} />
          Special Programs
        </button>
      </div>

      {/* ── EVENTS TAB ── */}
      {tab === 'events' && (
        <>
          {eventsLoading ? (
            <div className="glass-card p-10 text-center text-white/30 text-sm">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="glass-card p-10">
              <EmptyState icon={Calendar} title="No upcoming events" description="Past events are hidden. New events will appear here once added." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((event: any, idx: number) => (
                <div
                  key={event.id}
                  className="glass-card p-5 animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                      <span className="text-lg font-bold leading-none text-gold">
                        {format(parseISO(event.event_date), 'd')}
                      </span>
                      <span className="text-[9px] uppercase leading-none text-gold/60">
                        {format(parseISO(event.event_date), 'MMM')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-white text-sm leading-tight truncate">{event.title}</h3>
                      <p className="text-[10px] text-white/35 mt-0.5">{format(parseISO(event.event_date), 'EEEE, yyyy')}</p>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-xs text-white/45 leading-relaxed mb-3 line-clamp-2">{event.description}</p>
                  )}

                  <div className="space-y-1">
                    {event.start_time && (
                      <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                        <Clock size={10} className="text-gold/40" />
                        {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                        <MapPin size={10} className="text-gold/40" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SPECIAL PROGRAMS TAB ── */}
      {tab === 'programs' && (
        <>
          {/* Info banner */}
          <div className="mb-5 glass-card p-4 flex items-start gap-3 border-l-2 border-gold/40">
            <Sparkles size={14} className="text-gold/60 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/55 leading-relaxed">
              <span className="text-white/80 font-semibold">For non-regular programs only</span> — conferences, conventions, retreats, crusades, etc.
              Programs added here appear on the WhatsApp bot under &quot;Special Programs&quot;.
              Toggle a program <span className="text-white/70">off</span> to hide it without deleting.
            </p>
          </div>

          {programsLoading ? (
            <div className="glass-card p-12 text-center">
              <Loader2 size={24} className="animate-spin text-gold/40 mx-auto mb-2" />
              <p className="text-white/30 text-sm">Loading programs...</p>
            </div>
          ) : programs.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <Sparkles size={28} className="text-gold/30" />
              </div>
              <h3 className="font-display font-semibold text-white/60 text-base mb-1">No special programs yet</h3>
              <p className="text-white/30 text-sm">Click &quot;Add Program&quot; to add conferences, retreats, conventions, or any one-off program.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {programs.map((prog, idx) => (
                <div
                  key={prog.id}
                  className={`glass-card overflow-hidden animate-slide-up transition-all duration-200 ${!prog.is_active ? 'opacity-50' : ''}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Program image */}
                  {prog.image_url ? (
                    <div className="w-full h-40 overflow-hidden">
                      <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center"
                      style={{ background: 'rgba(201,168,76,0.05)', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                      <ImageIcon size={28} className="text-gold/15" />
                    </div>
                  )}
                  <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-white text-sm leading-tight">{prog.title}</h3>
                      {prog.created_by && (
                        <p className="text-[10px] text-white/30 mt-0.5">Added by {prog.created_by}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleActive(prog)}
                      title={prog.is_active ? 'Click to hide from bot' : 'Click to show on bot'}
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                        prog.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {prog.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </div>

                  {prog.description && (
                    <p className="text-xs text-white/45 leading-relaxed mb-3 line-clamp-2">{prog.description}</p>
                  )}

                  {(prog.program_date || prog.end_date) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <CalendarDays size={11} className="text-gold/40 flex-shrink-0" />
                      <span className="text-[11px] text-white/35">
                        {prog.program_date ? format(parseISO(prog.program_date), 'MMM d, yyyy') : ''}
                        {prog.end_date && prog.program_date ? ` – ${format(parseISO(prog.end_date), 'MMM d, yyyy')}` : ''}
                        {prog.end_date && !prog.program_date ? `Until ${format(parseISO(prog.end_date), 'MMM d, yyyy')}` : ''}
                      </span>
                    </div>
                  )}

                  {prog.flyer_url && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Link2 size={11} className="text-gold/40 flex-shrink-0" />
                      <a href={prog.flyer_url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-gold/70 hover:text-gold underline underline-offset-2 truncate max-w-[200px]">
                        View Flyer
                      </a>
                    </div>
                  )}

                  {canWrite && (
                    <div className="pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleDeleteProgram(prog.id, prog.title)}
                        disabled={deletingId === prog.id}
                        className="flex items-center gap-1.5 text-[11px] text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === prog.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Remove
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Program Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)' }}>
                  <Sparkles size={15} className="text-gold" />
                </div>
                <h2 className="font-display font-bold text-white text-base">Add Special Program</h2>
              </div>
              <button onClick={() => { setShowModal(false); setForm(defaultForm); setImageFile(null); setImagePreview(null); }}
                className="text-white/30 hover:text-white/70 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  Program Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Annual Convention, Holy Ghost Congress, Retreat..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none placeholder-white/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  <FileText size={11} className="inline mr-1 mb-0.5" />
                  Short Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description shown to WhatsApp bot members..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none placeholder-white/20 transition-colors resize-none"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  <ImagePlus size={11} className="inline mr-1 mb-0.5" />
                  Program Image (optional)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed rounded-xl cursor-pointer overflow-hidden transition-colors"
                  style={{ borderColor: imagePreview ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.1)' }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-semibold">Click to change image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 flex flex-col items-center justify-center gap-1.5">
                      <ImagePlus size={22} className="text-white/20" />
                      <p className="text-xs text-white/40">Click to upload program image</p>
                      <p className="text-[10px] text-white/25">PNG, JPG up to 10MB · shown on the dashboard card</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  <Link2 size={11} className="inline mr-1 mb-0.5" />
                  Flyer Link (optional)
                </label>
                <input
                  type="url"
                  value={form.flyer_url}
                  onChange={e => setForm(f => ({ ...f, flyer_url: e.target.value }))}
                  placeholder="https://... (Google Drive, Dropbox, etc.)"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none placeholder-white/20 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">
                    <CalendarDays size={11} className="inline mr-1 mb-0.5" />
                    Start Date
                  </label>
                  <input type="date" value={form.program_date}
                    onChange={e => setForm(f => ({ ...f, program_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none transition-colors"
                    style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">End Date</label>
                  <input type="date" value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-gold/40 focus:outline-none transition-colors"
                    style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <p className="text-[11px] text-white/30 leading-relaxed">
                💡 Once added, this program appears live on the WhatsApp bot immediately.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setForm(defaultForm); setImageFile(null); setImagePreview(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleAddProgram} disabled={saving || !form.title.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', color: '#0A0E1A', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {saving ? 'Adding...' : 'Add Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
