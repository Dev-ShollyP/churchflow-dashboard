'use client';

import { useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { createClient } from '@/lib/supabase';
import { UploadCloud, CheckCircle2, AlertCircle, Calendar, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadFlyerPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('RCCG Everflourishing Mega Sanctuary (7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota)');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Service' | 'Special Program' | 'Giving'>('Special Program');

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate) {
      setError('Please fill in the Event Title and Date.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const supabase = createClient();
      let flyerPublicUrl = '';

      // 1. Upload Flyer File to Supabase Storage if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${category}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Flyers')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('Flyers')
          .getPublicUrl(filePath);

        flyerPublicUrl = publicUrlData.publicUrl;
      }

      // 2. Fetch Branch ID
      const { data: branchData } = await supabase.from('branches').select('id').limit(1).single();
      const branchId = branchData?.id;

      // 3. Insert into `events` table
      const { data: eventData, error: eventError } = await supabase.from('events').insert({
        branch_id: branchId,
        title,
        description,
        event_date: eventDate,
        start_time: startTime || '08:00:00',
        location,
      }).select().single();

      if (eventError) {
        throw new Error(`Event creation failed: ${eventError.message}`);
      }

      // 4. Create Knowledge Article so n8n AI instantly learns and quotes it
      const knowledgeMarkdown = `
**Theme/Title**: ${title}
**Date**: ${eventDate}
**Time**: ${startTime || 'To be announced'}
**Venue**: ${location}
**Details**: ${description}
${flyerPublicUrl ? `**Flyer URL**: ${flyerPublicUrl}` : ''}
      `.trim();

      await supabase.from('knowledge_articles').insert({
        branch_id: branchId,
        title: `Special Program: ${title}`,
        category: 'Event',
        markdown: knowledgeMarkdown,
        visibility: 'public',
        priority: 100,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/events');
        router.refresh();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to upload special program.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Upload Special Program & Flyer"
        subtitle="Upload flyers and announce upcoming programs — n8n AI will automatically quote it to members."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm flex items-center gap-3">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm flex items-center gap-3">
                <CheckCircle2 size={18} className="flex-shrink-0" />
                <span>Special Program uploaded successfully! Redirecting...</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                Program Title / Theme *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. August Early Morning Prayer (Mountain Movers)"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                Folder Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
              >
                <option value="Special Program">Special Program</option>
                <option value="Service">Regular Service</option>
                <option value="Giving">Giving / Project</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                Venue / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                Program Description & Key Details
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Include ministers, bible verses, or special instructions for members..."
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
            </div>

            {/* Drag and Drop File Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">
                Upload Program Flyer Image
              </label>
              <div className="border-2 border-dashed border-white/15 hover:border-gold/50 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-navy-dark/40 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud size={32} className="mx-auto text-gold/70 mb-2" />
                <p className="text-sm font-medium text-white">Click or drag image file here</p>
                <p className="text-xs text-white/40 mt-1">PNG, JPG, JPEG up to 10MB</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-navy-dark transition-all duration-200 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)', boxShadow: '0 4px 20px rgba(201,168,76,0.25)' }}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {uploading ? 'Publishing Program...' : 'Publish Special Program & Sync AI'}
            </button>
          </form>
        </div>

        {/* Preview Column */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-gold" /> Flyer Preview
            </h3>

            {previewUrl ? (
              <div className="rounded-xl overflow-hidden border border-gold/30 shadow-gold mb-4">
                <img src={previewUrl} alt="Flyer Preview" className="w-full h-auto object-cover" />
              </div>
            ) : (
              <div className="w-full h-64 rounded-xl border border-white/10 bg-navy-dark/60 flex flex-col items-center justify-center text-center p-4 mb-4">
                <ImageIcon size={36} className="text-white/20 mb-2" />
                <p className="text-xs text-white/40">No flyer image selected yet</p>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <p className="text-white/50"><strong className="text-white">Title:</strong> {title || 'Untitled Program'}</p>
              <p className="text-white/50"><strong className="text-white">Date:</strong> {eventDate || 'Not specified'}</p>
              <p className="text-white/50"><strong className="text-white">Time:</strong> {startTime || 'Not specified'}</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-navy-mid/60 border border-gold/20 text-xs text-gold/80 leading-relaxed">
            ✨ <strong>AI Auto-Sync:</strong> Once published, the WhatsApp bot will immediately answer member questions about this event and send reminders!
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
