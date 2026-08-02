'use client';

import { useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { QrCode, Printer, Download, MessageCircle, Share2, Sparkles, Copy, Check } from 'lucide-react';

export default function MemberOnboardingPage() {
  const whatsappNumber = '2348103386751'; // EVF WhatsApp Number
  const defaultMessage = 'Hello RCCG EVF Sanctuary';
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(waLink)}&color=0D1B3E&bgcolor=FFFFFF`;

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(waLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardShell>
      <div className="print:hidden">
        <PageHeader
          title="Church Member Onboarding Kit"
          subtitle="Printable posters, bulletin slips, and WhatsApp QR codes for onboarding RCCG EVF Sanctuary members."
          action={
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-navy-dark transition-all shadow-gold"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)' }}
            >
              <Printer size={16} /> Print Onboarding Flyer
            </button>
          }
        />
      </div>

      {/* Screen View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        {/* Onboarding Strategy Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold text-white text-lg mb-3 flex items-center gap-2">
              <Sparkles className="text-gold" size={20} /> 3-Step Church Onboarding Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-navy-mid/60 border border-white/8">
                <span className="inline-block px-2 py-0.5 rounded bg-gold/15 text-gold font-bold mb-2">Step 1</span>
                <p className="font-semibold text-white text-sm mb-1">Sunday Announcement</p>
                <p className="text-white/50 leading-relaxed">
                  Have the Pastor or Usher make a 30-second announcement telling members to scan the QR code on the bulletin or poster.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-mid/60 border border-white/8">
                <span className="inline-block px-2 py-0.5 rounded bg-gold/15 text-gold font-bold mb-2">Step 2</span>
                <p className="font-semibold text-white text-sm mb-1">Entrance Poster</p>
                <p className="text-white/50 leading-relaxed">
                  Print and mount the A4 QR Poster at the church entrance & notice boards so members can scan on arrival.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-mid/60 border border-white/8">
                <span className="inline-block px-2 py-0.5 rounded bg-gold/15 text-gold font-bold mb-2">Step 3</span>
                <p className="font-semibold text-white text-sm mb-1">First-Timer Slip</p>
                <p className="text-white/50 leading-relaxed">
                  Usher hands out the QR Slip to first-timers. Typing "Hi" auto-registers them in your database.
                </p>
              </div>
            </div>
          </div>

          {/* Direct Link Share Card */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white text-sm mb-3">WhatsApp Direct Link</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={waLink}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs text-white bg-navy-dark/60 border border-white/10 font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-navy-mid text-gold border border-gold/30 hover:bg-gold/10 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Poster Card Preview */}
        <div className="glass-card p-6 text-center flex flex-col items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-4">Printable Poster Preview</h3>
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-navy-dark border-4 border-gold/40">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-navy-dark text-gold font-bold font-display text-sm mb-2">
                EVF
              </div>
              <h4 className="font-display font-bold text-base leading-tight text-navy-dark">RCCG EVERFLOURISHING</h4>
              <p className="text-[10px] text-gray-600 font-semibold mb-3">MEGA SANCTUARY (OTA)</p>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 inline-block mb-3">
                <img src={qrApiUrl} alt="WhatsApp QR Code" className="w-40 h-40 mx-auto" />
              </div>

              <p className="text-xs font-bold text-navy-dark mb-1">SCAN TO CONNECT ON WHATSAPP</p>
              <p className="text-[10px] text-gray-500">Get Service Times, Audio Sermons, Event Flyers & Prayer Support</p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full mt-6 py-2.5 rounded-xl text-xs font-semibold bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={14} /> Print Full Page Poster
          </button>
        </div>
      </div>

      {/* Printable Poster Layout (Hidden on Screen, Visible on Print) */}
      <div className="hidden print:block text-black bg-white p-8 max-w-2xl mx-auto min-h-screen">
        <div className="border-8 border-navy-dark rounded-3xl p-8 text-center flex flex-col justify-between h-[95vh]">
          <div>
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-navy-dark text-amber-400 font-bold font-display text-2xl mb-4 border-4 border-amber-400">
              EVF
            </div>
            <h1 className="font-display font-extrabold text-3xl text-navy-dark tracking-tight">
              RCCG EVERFLOURISHING
            </h1>
            <p className="text-base font-bold text-amber-600 tracking-wider mb-6">
              MEGA SANCTUARY • OTA
            </p>

            <div className="p-6 bg-slate-50 rounded-2xl border-4 border-navy-dark inline-block mb-6 shadow-md">
              <img src={qrApiUrl} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto" />
            </div>

            <h2 className="font-display font-extrabold text-2xl text-navy-dark mb-2">
              SCAN WITH YOUR PHONE CAMERA
            </h2>
            <p className="text-base font-semibold text-slate-700 max-w-md mx-auto mb-6">
              Connect directly with our WhatsApp AI Assistant for Service Schedules, Audio Sermons, Prayer Requests & Special Event Flyers!
            </p>
          </div>

          <div className="border-t-2 border-slate-200 pt-6">
            <div className="grid grid-cols-3 gap-4 text-left text-xs">
              <div>
                <p className="font-bold text-navy-dark text-sm">🗓️ Sunday Services</p>
                <p className="text-slate-600">1st Service: 8:00 AM</p>
                <p className="text-slate-600">2nd Service: 10:15 AM</p>
              </div>
              <div>
                <p className="font-bold text-navy-dark text-sm">📖 Midweek Services</p>
                <p className="text-slate-600">Tue Digging Deep: 6:00 PM</p>
                <p className="text-slate-600">Thu Faith Clinic: 6:00 PM</p>
              </div>
              <div>
                <p className="font-bold text-navy-dark text-sm">📍 Church Address</p>
                <p className="text-slate-600">7 Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
