'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { createClient, getCurrentStaff, getBranchId, ScheduledBroadcast } from '@/lib/supabase';
import EmptyState from '@/components/ui/EmptyState';
import {
  Megaphone, Plus, Sparkles, Clock, Calendar, Image as ImageIcon,
  CheckCircle2, AlertCircle, Trash2, Edit3, Send, Play, Pause,
  Smartphone, ChevronRight, UploadCloud, RefreshCw, Eye, Tag, Users,
  Check, X, ExternalLink, HelpCircle
} from 'lucide-react';

const WEEKDAYS = [
  { id: 'monday', label: 'Mon', full: 'Monday' },
  { id: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { id: 'thursday', label: 'Thu', full: 'Thursday' },
  { id: 'friday', label: 'Fri', full: 'Friday' },
  { id: 'saturday', label: 'Sat', full: 'Saturday' },
  { id: 'sunday', label: 'Sun', full: 'Sunday' },
];

const TIME_PRESETS = [
  { label: '8:00 AM WAT (Morning)', value: '08:00:00' },
  { label: '12:00 PM WAT (Noon)', value: '12:00:00' },
  { label: '5:00 PM WAT (Evening)', value: '17:00:00' },
  { label: '6:00 PM WAT (Service)', value: '18:00:00' },
  { label: '7:00 PM WAT (Night)', value: '19:00:00' },
];

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'All Active Members', desc: 'Broadcast to everyone in the directory' },
  { id: 'youth', label: 'Youth & Singles (YAYA)', desc: 'Young adults and teens' },
  { id: 'workers', label: 'Workers & Ministers', desc: 'Active departmental leaders' },
  { id: 'first_timers', label: 'First Timers & Converts', desc: 'New converts & visitors' },
];

const TEMPLATE_PRESETS = [
  {
    title: 'A Great Light Vest Booking',
    days: ['monday', 'wednesday', 'friday'],
    time: '17:00:00',
    message: `*A GREAT LIGHT VEST!*

Start making your bookings now!
Available in all sizes.

👕 *Young*: ₦5,000
👕 *Adult*: ₦6,000

📲 *To book yours:*
Call or WhatsApp: 07030125009

💬 You can also place your order directly via WhatsApp:
https://wa.me/message/5GA3GIDJ7VZGD1

📱 Or simply scan the QR code to place your order.

Don't miss out — book yours today! 🔥`
  },
  {
    title: 'Weekly Fellowship Reminder',
    days: ['monday', 'wednesday'],
    time: '17:00:00',
    message: `*RCCG EVERFLOURISHING SANCTUARY*

Beloved of God, this is a reminder for our upcoming fellowship this week.

📖 _"Study to shew thyself approved unto God."_ — 2 Tim 2:15

📍 *Location*: Main Sanctuary, 7 Powerline Street, Iyana Iyesi, Ota.
⏰ *Time*: 6:00 PM WAT

Come ready to encounter God! 🙌`
  }
];

function formatTimeLabel(timeStr: string) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return timeStr;
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm} WAT`;
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<ScheduledBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState<string | null>(null);

  // Form / Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['monday', 'wednesday', 'friday']);
  const [sendTime, setSendTime] = useState('17:00:00');
  const [targetAudience, setTargetAudience] = useState('all');
  const [isActive, setIsActive] = useState(true);

  // Image Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test Sending Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testBroadcastId, setTestBroadcastId] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('08083708357');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Active Preview Item for Phone Mockup
  const [selectedPreview, setSelectedPreview] = useState<{ title: string; message: string; image_url?: string | null }>({
    title: TEMPLATE_PRESETS[0].title,
    message: TEMPLATE_PRESETS[0].message,
    image_url: ''
  });

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  async function fetchBroadcasts() {
    setLoading(true);
    try {
      const bId = await getBranchId();
      setBranchId(bId);

      const res = await fetch(`/api/broadcasts${bId ? `?branch_id=${bId}` : ''}`);
      const data = await res.json();
      if (data.broadcasts) {
        setBroadcasts(data.broadcasts);
        if (data.broadcasts.length > 0) {
          setSelectedPreview({
            title: data.broadcasts[0].title,
            message: data.broadcasts[0].message,
            image_url: data.broadcasts[0].image_url
          });
        }
      }
    } catch (e) {
      console.error('Failed to load broadcasts:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setTitle('');
    setMessage(TEMPLATE_PRESETS[0].message);
    setImageUrl('');
    setDaysOfWeek(['monday', 'wednesday', 'friday']);
    setSendTime('17:00:00');
    setTargetAudience('all');
    setIsActive(true);
    setUploadFile(null);
    setUploadPreview(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(bcast: ScheduledBroadcast) {
    setEditingId(bcast.id);
    setTitle(bcast.title);
    setMessage(bcast.message);
    setImageUrl(bcast.image_url || '');
    setDaysOfWeek(bcast.days_of_week || ['monday', 'wednesday', 'friday']);
    setSendTime(bcast.send_time || '17:00:00');
    setTargetAudience(bcast.target_audience || 'all');
    setIsActive(bcast.is_active);
    setUploadFile(null);
    setUploadPreview(bcast.image_url || null);
    setIsModalOpen(true);
  }

  function handleDayToggle(dayId: string) {
    if (daysOfWeek.includes(dayId)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter(d => d !== dayId));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, dayId]);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  }

  async function handleSaveBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please provide a campaign title and WhatsApp message.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = imageUrl;

      // Upload image to Supabase storage if selected
      if (uploadFile) {
        setUploading(true);
        const supabase = createClient();
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `broadcast_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `Broadcasts/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('Flyers')
          .upload(filePath, uploadFile, { upsert: true });

        if (uploadErr) {
          throw new Error(`Image upload failed: ${uploadErr.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('Flyers')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        title: title.trim(),
        message: message.trim(),
        image_url: finalImageUrl || null,
        days_of_week: daysOfWeek,
        send_time: sendTime,
        target_audience: targetAudience,
        is_active: isActive,
        branch_id: branchId
      };

      if (editingId) {
        // Update
        const res = await fetch('/api/broadcasts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload })
        });
        if (!res.ok) throw new Error('Failed to update broadcast');
      } else {
        // Create
        const res = await fetch('/api/broadcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create broadcast');
      }

      setIsModalOpen(false);
      fetchBroadcasts();
    } catch (err: any) {
      alert(err.message || 'Error saving broadcast');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleToggleActive(bcast: ScheduledBroadcast) {
    try {
      const updatedStatus = !bcast.is_active;
      const res = await fetch('/api/broadcasts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bcast.id, is_active: updatedStatus })
      });
      if (res.ok) {
        setBroadcasts(broadcasts.map(b => b.id === bcast.id ? { ...b, is_active: updatedStatus } : b));
      }
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this scheduled broadcast campaign?')) return;
    try {
      const res = await fetch(`/api/broadcasts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBroadcasts(broadcasts.filter(b => b.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete broadcast:', e);
    }
  }

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testPhone) return;

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/broadcasts/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcast_id: testBroadcastId,
          test_phone: testPhone,
          custom_message: selectedPreview.message,
          custom_image_url: selectedPreview.image_url
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: 'Message successfully sent to your WhatsApp!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send WhatsApp message' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error' });
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-gold" />
              Scheduled Broadcasts & Announcements
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create recurring announcements, product promotions, and event reminders sent automatically to member phones.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-black font-semibold text-sm hover:brightness-110 shadow-lg shadow-gold/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Broadcast Campaign
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gold/10 text-gold">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Campaigns</p>
                <p className="text-xl font-bold text-foreground">{broadcasts.length}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Recurring</p>
                <p className="text-xl font-bold text-emerald-400">{broadcasts.filter(b => b.is_active).length}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Standard Broadcast Slots</p>
                <p className="text-xl font-bold text-foreground">5:00 PM WAT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Broadcasts List + Live Phone Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Campaigns List (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                Active Recurring Campaigns ({broadcasts.length})
              </h2>
              <button
                onClick={fetchBroadcasts}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center rounded-2xl border border-border/40 bg-card/40">
                <RefreshCw className="w-6 h-6 animate-spin text-gold mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading scheduled broadcasts...</p>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 bg-card/30">
                <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto mb-3">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-base">No Scheduled Broadcasts Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Create a campaign like "A Great Light Vest" to broadcast automatically to members on selected days of the week.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-black font-semibold text-sm hover:brightness-110 shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create First Broadcast
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {broadcasts.map(bcast => {
                  const isSelected = selectedPreview.title === bcast.title;
                  return (
                    <div
                      key={bcast.id}
                      onClick={() => setSelectedPreview({
                        title: bcast.title,
                        message: bcast.message,
                        image_url: bcast.image_url
                      })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-gold/60 bg-gold/5 shadow-md shadow-gold/5'
                          : 'border-border/40 bg-card/70 hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {bcast.image_url ? (
                            <img
                              src={bcast.image_url}
                              alt={bcast.title}
                              className="w-16 h-16 rounded-xl object-cover border border-border/50 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center flex-shrink-0 text-muted-foreground">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-foreground text-base truncate">{bcast.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                bcast.is_active
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                              }`}>
                                {bcast.is_active ? 'Active' : 'Paused'}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {bcast.message}
                            </p>

                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <div className="flex items-center gap-1 text-[11px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" />
                                {formatTimeLabel(bcast.send_time)}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                                <Calendar className="w-3 h-3" />
                                {bcast.days_of_week?.map(d => d.slice(0, 3).toUpperCase()).join(', ')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setTestBroadcastId(bcast.id);
                              setSelectedPreview({
                                title: bcast.title,
                                message: bcast.message,
                                image_url: bcast.image_url
                              });
                              setTestModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-gold hover:bg-gold/10 transition-colors"
                            title="Send Test to My WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(bcast)}
                            className={`p-2 rounded-lg transition-colors ${
                              bcast.is_active
                                ? 'text-zinc-400 hover:bg-zinc-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={bcast.is_active ? 'Pause Campaign' : 'Activate Campaign'}
                          >
                            {bcast.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(bcast)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                            title="Edit Campaign"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(bcast.id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Phone Mockup Preview (5 Cols) */}
          <div className="lg:col-span-5 sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Live WhatsApp Mockup Preview
              </h2>
              <span className="text-xs text-muted-foreground">Real-time Layout</span>
            </div>

            {/* Mobile Phone Mockup Container */}
            <div className="w-full max-w-[340px] mx-auto rounded-[36px] p-3 bg-zinc-950 border-[6px] border-zinc-800 shadow-2xl relative overflow-hidden">
              {/* Speaker / Camera Notch */}
              <div className="w-24 h-4 bg-zinc-800 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-900 mr-2"></div>
                <div className="w-8 h-1 rounded-full bg-zinc-900"></div>
              </div>

              {/* WhatsApp App Header */}
              <div className="bg-emerald-800 text-white p-2.5 rounded-t-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-xs">
                  EVF
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs leading-tight truncate">EVF Bot</p>
                  <p className="text-[10px] text-emerald-200">Official Church Assistant</p>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="bg-[#0b141a] min-h-[380px] max-h-[460px] overflow-y-auto p-2.5 space-y-3 text-[12px] bg-opacity-95 relative rounded-b-2xl">
                {/* Background Pattern Hint */}
                <div className="text-center">
                  <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-full shadow-sm">
                    Today
                  </span>
                </div>

                {/* WhatsApp Message Bubble */}
                <div className="bg-[#1f2c34] text-zinc-100 rounded-2xl rounded-tl-sm p-2 shadow-md border border-zinc-700/30 max-w-[96%] space-y-2">
                  {selectedPreview.image_url ? (
                    <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-black/40">
                      <img
                        src={selectedPreview.image_url}
                        alt="Preview Flyer"
                        className="w-full h-44 object-cover"
                      />
                    </div>
                  ) : null}

                  {/* Formatted Text Body */}
                  <div className="whitespace-pre-line text-zinc-200 text-[11.5px] leading-relaxed break-words px-1">
                    {selectedPreview.message}
                  </div>

                  {/* WhatsApp Timestamp & Ticks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 pt-1 px-1">
                    <span>5:00 PM</span>
                    <span className="text-emerald-400">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Action Button Under Mockup */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => {
                    setTestBroadcastId(null);
                    setTestModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gold/20 hover:bg-gold/30 text-gold text-xs font-semibold border border-gold/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send This Preview to WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Create / Edit Campaign Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            <div className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
              {/* Pinned Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 flex-shrink-0 bg-zinc-900/80">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-gold" />
                  {editingId ? 'Edit Broadcast Campaign' : 'Create Recurring Broadcast'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveBroadcast} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                  {/* Template Quick Loader */}
                  {!editingId && (
                    <div className="p-3.5 rounded-xl bg-gold/5 border border-gold/20">
                      <p className="text-xs font-semibold text-gold mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Quick Templates
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {TEMPLATE_PRESETS.map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setTitle(tpl.title);
                              setMessage(tpl.message);
                              setDaysOfWeek(tpl.days);
                              setSendTime(tpl.time);
                              setSelectedPreview({
                                title: tpl.title,
                                message: tpl.message,
                                image_url: uploadPreview || imageUrl
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-200 hover:border-gold/50 hover:text-gold transition-colors"
                          >
                            {tpl.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campaign Title */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Campaign Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A Great Light Vest Booking"
                      value={title}
                      onChange={e => {
                        setTitle(e.target.value);
                        setSelectedPreview(prev => ({ ...prev, title: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/60 border border-white/20 text-sm focus:outline-none focus:border-gold/60 placeholder-white/30"
                    />
                  </div>

                  {/* WhatsApp Message Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-300">
                        WhatsApp Message Body * (Formatted text)
                      </label>
                      <span className="text-[11px] text-zinc-400">Use *bold*, _italic_, bullet points</span>
                    </div>
                    <textarea
                      rows={8}
                      required
                      placeholder="Type your WhatsApp announcement message..."
                      value={message}
                      onChange={e => {
                        setMessage(e.target.value);
                        setSelectedPreview(prev => ({ ...prev, message: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/60 border border-white/20 text-sm font-mono focus:outline-none focus:border-gold/60 leading-relaxed placeholder-white/30"
                    />
                  </div>

                  {/* Flyer / Product Photo Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Product / Flyer Image (Optional)
                    </label>

                    <div className="flex items-center gap-4">
                      {uploadPreview ? (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20 flex-shrink-0 group">
                          <img src={uploadPreview} alt="Flyer" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadFile(null);
                              setUploadPreview(null);
                              setImageUrl('');
                              setSelectedPreview(prev => ({ ...prev, image_url: '' }));
                            }}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-24 h-24 rounded-xl border border-dashed border-white/20 hover:border-gold/50 bg-zinc-900/50 flex flex-col items-center justify-center text-zinc-400 hover:text-gold transition-colors flex-shrink-0"
                        >
                          <UploadCloud className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-medium">Upload Image</span>
                        </button>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        accept="image/*"
                        className="hidden"
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs text-zinc-200 font-medium">Upload photo or flyer from your device</p>
                        <p className="text-[11px] text-zinc-400">PNG, JPG, or WEBP. Uploaded automatically to Supabase storage.</p>
                        {imageUrl && !uploadFile && (
                          <p className="text-[11px] text-gold truncate">Current: {imageUrl}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Days of the Week Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Repeat Days (Weekly Schedule) *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(w => {
                        const isSelected = daysOfWeek.includes(w.id);
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => handleDayToggle(w.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-gold text-black shadow-md shadow-gold/20'
                                : 'bg-zinc-900 border border-white/15 text-zinc-400 hover:border-white/30'
                            }`}
                          >
                            {w.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5">
                      Selected: {daysOfWeek.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                    </p>
                  </div>

                  {/* Broadcast Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Broadcast Time (WAT)
                      </label>
                      <select
                        value={sendTime}
                        onChange={e => setSendTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-white bg-zinc-900 border border-white/20 text-sm focus:outline-none focus:border-gold/60"
                      >
                        {TIME_PRESETS.map((t, idx) => (
                          <option key={idx} value={t.value} className="bg-zinc-900 text-white">{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Target Audience
                      </label>
                      <select
                        value={targetAudience}
                        onChange={e => setTargetAudience(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-white bg-zinc-900 border border-white/20 text-sm focus:outline-none focus:border-gold/60"
                      >
                        {AUDIENCE_OPTIONS.map(opt => (
                          <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-white/10">
                    <div>
                      <p className="text-xs font-semibold text-white">Campaign Active Status</p>
                      <p className="text-[11px] text-zinc-400">When active, this will automatically broadcast on chosen days.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/40'
                      }`}
                    >
                      {isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>

                {/* Pinned Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-white/10 flex-shrink-0 bg-zinc-900/80">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:brightness-110 shadow-lg shadow-gold/20 disabled:opacity-50 transition-all"
                  >
                    {saving || uploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving Campaign...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        {editingId ? 'Save Changes' : 'Create Campaign'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Test Modal */}
        {testModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/80">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-gold" />
                  Send Instant WhatsApp Test
                </h2>
                <button
                  onClick={() => setTestModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendTest} className="p-5 space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Enter your WhatsApp phone number to test and verify how the announcement flyer and message will look on your personal device.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    WhatsApp Phone Number (with Country Code or Local)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08083708357 or 2348083708357"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white bg-black/60 border border-white/20 text-sm font-mono focus:outline-none focus:border-gold/60 placeholder-white/30"
                  />
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/10 text-red-300 border border-red-500/30'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-gold/20"
                  >
                    {sendingTest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Test Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
