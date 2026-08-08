import DashboardShell from '@/components/DashboardShell';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import PageHeader from '@/components/ui/PageHeader';
import { Settings, Phone, Bot, Building } from 'lucide-react';

async function getSettings() {
  const supabase = await createServerSupabaseClient();
  const [sessionRes, promptRes, branchRes] = await Promise.all([
    supabase.from('whatsapp_sessions').select('phone_number_id, status, branch_id').limit(1).single(),
    supabase.from('ai_prompt_templates').select('provider, is_active, system_prompt').eq('is_active', true).limit(1).single(),
    supabase.from('branches').select('name, city, country').limit(1).single(),
  ]);
  return {
    session: sessionRes.data,
    prompt: promptRes.data,
    branch: branchRes.data,
  };
}

export default async function SettingsPage() {
  const { session, prompt, branch } = await getSettings();

  return (
    <DashboardShell>
      <PageHeader title="Settings" subtitle="ChurchFlow configuration" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Branch Info */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gold/12 border border-gold/20 flex items-center justify-center">
              <Building size={14} className="text-gold" />
            </div>
            <h2 className="font-display font-semibold text-white text-sm">Branch Info</h2>
          </div>
          <div className="space-y-3">
            <Row label="Name" value={branch?.name ?? 'RCCG Everflourishing Mega Sanctuary'} />
            <Row label="City" value={branch?.city ?? 'Ota'} />
            <Row label="Country" value={branch?.country ?? 'Nigeria'} />
          </div>
        </div>

        {/* WhatsApp Session */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
              <Phone size={14} className="text-emerald-400" />
            </div>
            <h2 className="font-display font-semibold text-white text-sm">WhatsApp Session</h2>
          </div>
          <div className="space-y-3">
            <Row label="Phone Number ID" value={session?.phone_number_id ?? '1252855381239526'} mono />
            <Row label="Status" value={session?.status ?? '—'} />
          </div>
        </div>

        {/* AI Config */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-500/12 border border-blue-500/20 flex items-center justify-center">
              <Bot size={14} className="text-blue-400" />
            </div>
            <h2 className="font-display font-semibold text-white text-sm">AI Configuration</h2>
          </div>
          <div className="space-y-3 mb-4">
            <Row label="Provider" value={prompt?.provider ?? '—'} />
            <Row label="Active" value={prompt?.is_active ? 'Yes' : 'No'} />
          </div>
          {prompt?.system_prompt && (
            <div>
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">System Prompt</p>
              <pre className="text-xs text-white/50 bg-navy-dark/60 rounded-xl p-4 overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed border border-white/8">
                {prompt.system_prompt}
              </pre>
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-white/35">{label}</span>
      <span className={`text-xs font-medium text-white/70 text-right truncate max-w-[60%] ${ mono ? 'font-mono text-gold/70' : '' }`}>
        {value}
      </span>
    </div>
  );
}
