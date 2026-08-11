'use client';

import { useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { QrCode, Printer, Download, MessageCircle, Share2, Sparkles, Copy, Check, ExternalLink, TestTube, CheckCircle2, PhoneCall } from 'lucide-react';

export default function MemberOnboardingPage() {
  const whatsappNumber = '2348103386751'; // EVF WhatsApp Number
  const defaultMessage = 'Hi';
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(waLink)}&color=0D1B3E&bgcolor=FFFFFF`;

  const [copied, setCopied] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(waLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('+234 810 338 6751');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const testPrompts = [
    { label: 'Start Menu', keyword: 'Hi', desc: 'Triggers the 4-item interactive list menu' },
    { label: 'August Prayer', keyword: 'August Prayer', desc: 'Returns flyer & details for Mountain Movers prayer' },
    { label: 'Annual Convention', keyword: 'Convention', desc: 'Returns RCCG 74th Convention flyer & Redemption City details' },
    { label: 'Service Schedule', keyword: 'What service is today?', desc: 'Deterministic date lookup for Bible Study / Faith Clinic / Sunday' },
    { label: 'Giving & Tithes', keyword: 'Account number', desc: 'Returns Access Bank Tithe & UBA Building Project details' },
    { label: 'First Timer', keyword: 'I am new here', desc: 'Sends welcoming prompt & collects name/location/prayer' },
  ];

  return (
    <DashboardShell>
      <div className="print:hidden">
        <PageHeader
          title="Bot Sharing & Member Onboarding Kit"
          subtitle="Share the WhatsApp Bot link with testers, print entrance posters, and test every prompt live."
          action={
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold btn-gold shadow-gold"
              >
                <MessageCircle size={15} /> Open WhatsApp Bot Live
              </a>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold btn-glass"
              >
                <Printer size={15} /> Print Poster
              </button>
            </div>
          }
        />
      </div>

      {/* Screen View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">

        {/* Left Column: Share & Test Suite */}
        <div className="lg:col-span-2 space-y-6">

          {/* Share Bot Card */}
          <div className="glass-card p-6 border-gold/30" style={{ background: 'radial-gradient(ellipse at 90% 0%, rgba(201,168,76,0.12) 0%, rgba(15,27,56,0.7) 70%)' }}>
            <h2 className="font-display font-semibold text-white text-lg mb-2 flex items-center gap-2">
              <Share2 className="text-gold" size={20} /> Share Bot Contact with Testers
            </h2>
            <p className="text-xs text-white/50 mb-5">
              Send this direct link to church members, pastors, or testers. Clicking it automatically opens WhatsApp with a pre-filled greeting message.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Phone Number Display */}
              <div className="p-4 rounded-xl bg-navy-dark/60 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">WhatsApp Phone Number</p>
                  <p className="font-mono text-sm font-bold text-white mt-0.5">+234 810 338 6751</p>
                </div>
                <button
                  onClick={handleCopyNumber}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gold transition-colors text-xs flex items-center gap-1"
                >
                  {copiedNumber ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {/* Quick Direct WhatsApp Button */}
              <div className="p-4 rounded-xl bg-navy-dark/60 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Direct WhatsApp Link</p>
                  <p className="text-xs text-gold font-medium truncate mt-0.5 max-w-[180px]">{waLink}</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30 transition-colors text-xs flex items-center gap-1"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Share to WhatsApp Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Praise the Lord! Click this link to connect with the RCCG Everflourishing Mega Sanctuary WhatsApp AI Assistant:\n\n👉 ${waLink}\n\nAsk for Service Times, Special Program Flyers, Giving Details, or Prayer Support!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl text-xs font-semibold text-navy-dark flex items-center justify-center gap-2 btn-gold shadow-gold"
            >
              <Share2 size={15} /> Forward Bot Link to a WhatsApp Contact / Group
            </a>
          </div>

          {/* Interactive Tester Suite */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white text-base mb-1 flex items-center gap-2">
              <TestTube className="text-gold" size={18} /> Interactive Bot Test Suite
            </h3>
            <p className="text-xs text-white/40 mb-4">
              Click any sample prompt below to open WhatsApp with the exact keyword pre-filled:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testPrompts.map((pt, i) => (
                <a
                  key={i}
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(pt.keyword)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-white/5 border border-white/8 hover:border-gold/30 hover:bg-white/10 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white group-hover:text-gold transition-colors">{pt.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-mono">"{pt.keyword}"</span>
                    </div>
                    <p className="text-[11px] text-white/35 mt-1">{pt.desc}</p>
                  </div>
                  <ExternalLink size={14} className="text-white/30 group-hover:text-gold transition-colors flex-shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>

          {/* 3-Step Church Onboarding Plan */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Sparkles className="text-gold" size={16} /> 3-Step Sunday Rollout Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-black/20 border border-white/8">
                <span className="inline-block px-2 py-0.5 rounded bg-gold/15 text-gold font-bold mb-2">Step 1</span>
                <p className="font-semibold text-white text-sm mb-1">Sunday Announcement</p>
                <p className="text-white/40 leading-relaxed">
                  Have the Pastor make a 30-second announcement telling members to scan the QR code on the bulletin slip.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/20 border border-white/8">
                <span className="inline-block px-2 py-0.5 rounded bg-gold/15 text-gold font-bold mb-2">Step 2</span>
                <p className="font-semibold text-white text-sm mb-1">Entrance Poster</p>
                <p className="text-white/40 leading-relaxed">
                  Mount the A4 QR Poster at the church entrance & notice boards so members can scan on arrival.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/20 border border-white/8">
                <span className="inline-block px-2 py-0.5 rounded bg-gold/15 text-gold font-bold mb-2">Step 3</span>
                <p className="font-semibold text-white text-sm mb-1">First-Timer Slip</p>
                <p className="text-white/40 leading-relaxed">
                  Usher hands out the QR Slip to first-timers. Typing "Hi" auto-registers them in your dashboard.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Printable Poster Card Preview */}
        <div className="glass-card p-6 text-center flex flex-col items-center justify-between border-gold/30">
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-4">Printable Entrance Poster</h3>
            
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-navy-dark border-4 border-gold/40">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-navy-dark text-gold font-bold font-display text-base mb-2 shadow-lg">
                EVF
              </div>
              <h4 className="font-display font-extrabold text-base leading-tight text-navy-dark">RCCG EVERFLOURISHING</h4>
              <p className="text-[10px] text-amber-700 font-bold mb-4 tracking-wider">MEGA SANCTUARY (OTA)</p>

              <div className="p-3 bg-slate-50 rounded-xl border-2 border-navy-dark inline-block mb-4 shadow-md">
                <img src={qrApiUrl} alt="WhatsApp QR Code" className="w-44 h-44 mx-auto" />
              </div>

              <p className="text-xs font-black text-navy-dark mb-1 tracking-tight">SCAN TO CONNECT ON WHATSAPP</p>
              <p className="text-[10px] text-slate-600 leading-tight">Get Service Schedules, Program Flyers, Giving Accounts & Prayer Support</p>
            </div>
          </div>

          <div className="w-full space-y-2 mt-6">
            <button
              onClick={handlePrint}
              className="w-full py-2.5 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center justify-center gap-2"
            >
              <Printer size={15} /> Print Full Page Poster (A4)
            </button>
            <a
              href={qrApiUrl}
              download="ChurchFlow_EVF_WhatsApp_QR.png"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl text-xs font-medium btn-glass flex items-center justify-center gap-2"
            >
              <Download size={14} className="text-gold" /> Download High-Res QR Code
            </a>
          </div>
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
