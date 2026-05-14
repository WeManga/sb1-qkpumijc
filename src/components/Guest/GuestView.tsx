import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle2, Plus, Clock, Sparkles, Film, Volume2, VolumeX } from 'lucide-react'; 
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../lib/i18n';

const THEME_EMOJIS: Record<string, string[]> = {
  wedding: ['🤍', '💍', '🕊️', '✨', '🌸'],
  birthday: ['🎂', '🎈', '✨', '🎉', '🍰'],
  party: ['✨', '🎸', '🥂', '🕺', '🌟'],
  baptism: ['👼', '☁️', '🤍', '✨', '🕊️'],
  babyshower: ['🍼', '🤍', '👶', '💖', '💙'],
  funeral: ['🙏', '🕊️', '🥀', '⚰️', '🤍'],
  default: ['✨', '🌟', '🤍']
};

export function GuestView({ invitation }: any) {
  const [isOpened, setIsOpened] = useState(false);
  const [view, setView] = useState<'envelope' | 'content'>('envelope');
  const [isMuted, setIsMuted] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [guests, setGuests] = useState([{ firstName: '', lastName: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [vaultCode, setVaultCode] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const lang = (invitation.language as Language) || (localStorage.getItem('invite_lang') as Language) || 'fr';
  const t = translations[lang].guest;
  const tBuilder = translations[lang].builder;
  const emojis = THEME_EMOJIS[invitation?.event_type] || THEME_EMOJIS.default;

  const getPaperClass = () => {
    switch(invitation.paper_type) {
      case 'parchment': return 'paper-parchment';
      case 'grainy': return 'paper-grainy';
      case 'cotton': return 'paper-cotton';
      case 'silk': return 'paper-silk';
      case 'velvet': return 'paper-velvet';
      default: return 'paper-smooth';
    }
  };

  useEffect(() => {
    const newGuests = Array.from({ length: guestCount }, (_, i) => 
      guests[i] || { firstName: '', lastName: '' }
    );
    setGuests(newGuests);
  }, [guestCount]);

  useEffect(() => {
    if (isOpened && invitation?.music_url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [isOpened, invitation?.music_url]);

  useEffect(() => {
    if (!isOpened && invitation.opening_style === 'vault') {
      const interval = setInterval(() => {
        setVaultCode(Math.floor(Math.random() * 99));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isOpened, invitation.opening_style]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const addToCalendar = () => {
    const eventDate = new Date(invitation.event_date);
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(invitation.title)}&dates=${formatDate(eventDate)}/${formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000))}&location=${encodeURIComponent(invitation.event_address)}&details=${encodeURIComponent(invitation.description || "")}`;
    window.open(googleUrl, '_blank');
  };

  const openMaps = () => {
    const address = encodeURIComponent(invitation.event_address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('responses').insert([{
          invitation_id: invitation.id,
          group_leader_name: `${guests[0].firstName} ${guests[0].lastName}`,
          guest_details: guests,
          total_guests: guestCount
      }]);
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) { console.error(err); } 
    finally { setIsSubmitting(false); }
  };

  const EmojiRain = () => {
    const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${(i * 4) + (Math.random() * 3)}%`,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 2
    })), [emojis]);

    return (
      <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.span key={p.id} initial={{ y: -50, opacity: 0 }} animate={{ y: 1000, opacity: [0, 1, 1, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
            className="absolute text-3xl" style={{ left: p.left }}>{p.emoji}
          </motion.span>
        ))}
      </div>
    );
  };

  const isDoorType = invitation.opening_style === 'key' || invitation.opening_style === 'vault';

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden touch-none bg-white" style={{ fontFamily: invitation.font_style || 'inherit' }}>
      {invitation?.music_url && <audio ref={audioRef} src={invitation.music_url} loop />}
      {isOpened && <EmojiRain />}
      
      <AnimatePresence mode="wait">
        {view === 'envelope' ? (
          <motion.div key="env" className="relative w-full h-full flex items-center justify-center">
            {isOpened && invitation?.music_url && (
              <button onClick={toggleMute} className="absolute top-6 right-6 z-[70] w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18} className="animate-pulse"/>}
              </button>
            )}

            {/* --- ANIMATION D'OUVERTURE (VINYLE OU PELLICULE RAPPROCHÉE) --- */}
            <motion.div 
              initial={{ y: -450 }} 
              animate={isOpened ? { y: invitation.opening_type === 'filmstrip' ? -70 : -120 } : { y: -450 }} 
              transition={{ type: "spring", damping: 25 }} 
              className="absolute top-0 z-20"
            >
              {invitation.opening_type === 'filmstrip' ? (
                <div className="relative w-44 h-72 bg-[#1a1a1a] rounded-xl shadow-2xl rotate-[-2deg] overflow-hidden p-2 border-y-4 border-[#1a1a1a]">
                  <div className="absolute inset-y-0 left-1.5 w-1.5 border-l-2 border-dashed border-white/20 z-10" />
                  <div className="absolute inset-y-0 right-1.5 w-1.5 border-r-2 border-dashed border-white/20 z-10" />
                  <motion.div animate={{ y: [0, -360] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="flex flex-col gap-2">
                    {[
                      { url: invitation.main_photo_url, key: 'main_photo_url' },
                      { url: invitation.photo_url_2, key: 'photo_url_2' },
                      { url: invitation.photo_url_3, key: 'photo_url_3' },
                      { url: invitation.main_photo_url, key: 'main_photo_url' },
                      { url: invitation.photo_url_2, key: 'photo_url_2' },
                      { url: invitation.photo_url_3, key: 'photo_url_3' }
                    ].map((imgObj, idx) => (
                      <div key={idx} className="w-full h-28 bg-[#222] rounded-sm overflow-hidden relative shrink-0">
                        {imgObj.url ? (
                          <img 
                            src={imgObj.url} 
                            className="w-full h-full object-cover grayscale-[0.2] contrast-125" 
                            style={{ transform: `translate(${invitation[`${imgObj.key}_pos_x`] || 0}px, ${invitation[`${imgObj.key}_pos_y`] || 0}px) scale(${invitation[`${imgObj.key}_scale`] || 1})` }}
                            alt="" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800"><Film className="text-gray-600" size={20}/></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className={`w-[270px] h-[270px] relative ${isOpened ? 'animate-disk-spin' : ''}`}>
                  <div className="absolute inset-0 rounded-full bg-[#111] overflow-hidden">
                      <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-radial-gradient(circle, #444 0, #000 2px, #111 4px)' }} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full border-[5px] border-[#111] overflow-hidden">
                      {invitation.main_photo_url && (
                        <img 
                          src={invitation.main_photo_url} 
                          className="w-full h-full object-cover" 
                          style={{ transform: `translate(${invitation.main_photo_url_pos_x || 0}px, ${invitation.main_photo_url_pos_y || 0}px) scale(${invitation.main_photo_url_scale || 1})` }} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* --- CARTE D'INVITATION (REMONTEE POUR RAPPROCHEMENT) --- */}
            <motion.div 
              initial={{ scale: 0.8, y: 200 }} 
              animate={isOpened ? { scale: 1, y: 110 } : {}} 
              transition={{ type: "spring", damping: 20, delay: 0.4 }} 
              onClick={() => isOpened && setView('content')} 
              className={`z-30 w-[310px] h-[370px] rounded-[3rem] shadow-xl p-10 flex flex-col items-center justify-between border border-gray-100 cursor-pointer ${getPaperClass()}`}
            >
              <div className="text-center pt-14 w-full">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 break-words" style={{ fontFamily: invitation.font_style }}>
                  {invitation?.title || tBuilder.title_placeholder}
                </h2>
                <div className="w-8 h-1 bg-amber-400 mx-auto mb-4" />
                <p className="opacity-60 text-[9px] font-bold uppercase tracking-[0.3em]">{t.tap_open}</p>
              </div>
              <div className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase text-center tracking-widest">
                {lang === 'vi' ? 'Xem chi tiết' : lang === 'en' ? 'See details' : 'Voir les détails'}
              </div>
            </motion.div>

            {/* --- SYSTEME D'OUVERTURE (IDENTIQUE PREVIEW) --- */}
            <div className="absolute inset-0 z-50 overflow-hidden" style={{ perspective: '2000px', pointerEvents: isOpened ? 'none' : 'auto' }}>
              <AnimatePresence>
                {!isOpened && (
                  <motion.div 
                    key="gate-container"
                    exit={{ opacity: 1 }}
                    className="w-full h-full relative"
                  >
                    <motion.div 
                      key="visual-trigger"
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.1 }}
                      className="absolute inset-0 z-[70] flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => setIsOpened(true)}
                    >
                      <motion.div
                        animate={invitation.opening_style === 'knock' ? {
                          x: [0, -1, 2, -2, 1, 0, 0, -1, 2, -2, 1, 0, 0], 
                          y: [0, 1, -1, 1, -1, 0, 0, 1, -1, 1, -1, 0, 0]
                        } : {}}
                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }}
                      >
                        {invitation.opening_style === 'knock' ? (
                          <motion.div
                            animate={{ rotateX: [0, -40, 0, -40, 0], z: [0, 80, 0, 80, 0], scale: [1, 1.15, 1, 1.15, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }}
                            style={{ originY: "100%", filter: "sepia(0.5) saturate(0.8) brightness(1.2)" }}
                            className="text-[100px] select-none"
                          >✊</motion.div>
                        ) : invitation.opening_style === 'key' ? (
                            <div className="flex flex-col items-center relative">
                              <div className="w-2.5 h-10 bg-black/80 rounded-full shadow-sm" />
                              <div className="w-6 h-6 bg-black/80 rounded-full -mt-1.5 shadow-sm" />
                              <motion.div
                                animate={{ rotate: [0, 30, 0, 30, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.5 }}
                                className="absolute text-[110px] z-10"
                                style={{ top: '-25%', transformOrigin: "center 65%" }}
                              >🗝️</motion.div>
                            </div>
                        ) : invitation.opening_style === 'vault' ? (
                          <div className="relative w-60 h-60 flex flex-col items-center justify-center">
                             <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-100 to-gray-500 rounded-full border-[10px] border-amber-400/80 shadow-2xl" />
                             <div className="absolute top-8 bg-black/90 px-4 py-1 rounded-lg border-2 border-amber-500/50 z-20">
                                <span className="text-amber-500 font-mono text-xl tracking-[0.4em]">{vaultCode < 10 ? `0${vaultCode}` : vaultCode}</span>
                             </div>
                             <motion.div
                               animate={{ rotate: [0, 160, -80, 290, 0] }}
                               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                               className="w-40 h-40 rounded-full border-[6px] border-gray-600 bg-gradient-to-tr from-[#222] via-[#444] to-[#111] flex items-center justify-center relative z-10"
                             >
                                {[...Array(12)].map((_, i) => (
                                  <div key={i} className="absolute w-1 h-2.5 bg-amber-400/60" style={{ transform: `rotate(${i * 30}deg) translateY(-68px)` }} />
                                ))}
                                <div className="w-14 h-14 rounded-full bg-gradient-to-b from-gray-200 to-gray-500 border-4 border-amber-500/50 flex items-center justify-center">
                                   <div className="w-1.5 h-10 bg-red-600 rounded-full -translate-y-2" />
                                </div>
                             </motion.div>
                          </div>
                        ) : (
                          <img src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" className="w-[32rem] h-[32rem] object-contain" alt="Sceau" />
                        )}
                      </motion.div>
                      <p className="absolute bottom-12 text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
                        {lang === 'fr' ? "Appuyez pour ouvrir l'invitation" : lang === 'en' ? "Tap to open invitation" : "Nhấn de mở lời mời"}
                      </p>
                    </motion.div>

                    {isDoorType ? (
                      <>
                        <motion.div 
                          exit={{ rotateY: -110, originX: 0, opacity: 0 }} 
                          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.1 }}
                          className="absolute inset-y-0 left-0 w-1/2 z-50 border-r border-white/10 shadow-2xl"
                          style={{ background: invitation?.envelope_color || '#F3F4F6' }}
                        />
                        <motion.div 
                          exit={{ rotateY: 110, originX: 1, opacity: 0 }} 
                          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.1 }}
                          className="absolute inset-y-0 right-0 w-1/2 z-50 border-l border-white/10 shadow-2xl"
                          style={{ background: invitation?.envelope_color || '#F3F4F6' }}
                        />
                      </>
                    ) : (
                      <motion.div 
                        exit={{ y: "-100%" }} 
                        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
                        className="absolute inset-0 z-50 shadow-2xl"
                        style={{ background: invitation?.envelope_color || '#F3F4F6' }}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* --- CONTENU --- */
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`w-full h-full z-[100] flex flex-col overflow-y-auto ${getPaperClass()}`}>
            <div className="h-[30%] relative overflow-hidden shrink-0">
               <img 
                 src={invitation.main_photo_url} 
                 className="w-full h-full object-cover" 
                 style={{ transform: `translate(${invitation.main_photo_url_pos_x || 0}px, ${invitation.main_photo_url_pos_y || 0}px) scale(${invitation.main_photo_url_scale || 1})` }} 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
               <button onClick={() => setView('envelope')} className="absolute top-6 left-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md"><X size={20}/></button>
            </div>

            <div className="flex-1 p-8 space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-black mb-4 leading-tight" style={{ fontFamily: invitation.font_style }}>{invitation?.host_names || tBuilder.hosts_placeholder}</h2>
                <div className="flex flex-col items-center gap-2 opacity-60 font-bold text-[10px] uppercase tracking-widest text-gray-700">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-amber-500"/> {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'en' ? 'en-US' : 'fr-FR', {day:'numeric', month:'long', year:'numeric'}) : t.save_date}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-amber-500"/> {invitation.event_address || tBuilder.address_placeholder}</div>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                   <button onClick={addToCalendar} className="p-3 bg-amber-50 rounded-full shadow-sm"><Calendar size={18} className="text-amber-600" /></button>
                   <button onClick={openMaps} className="p-3 bg-amber-50 rounded-full shadow-sm"><MapPin size={18} className="text-amber-600" /></button>
                </div>
              </div>

              {invitation.description && (
                <div className="text-center italic opacity-80" style={{ fontFamily: invitation.font_style }}>
                  <p className="text-[13px] leading-relaxed px-4 whitespace-pre-wrap">{invitation.description}</p>
                </div>
              )}

              <div className="space-y-12">
                <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-2">
                   <Sparkles size={12}/> {tBuilder.program_title} <Sparkles size={12}/>
                </h3>
                <div className="relative flex flex-col items-center">
                  <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 3.0 }} className="absolute top-0 w-[2px] h-full bg-gradient-to-b from-amber-100 via-amber-500 to-amber-100 origin-top" />
                  <div className="relative space-y-12 w-full">
                    {(invitation.event_program || []).map((step: any, i: number) => {
                      const isEven = i % 2 === 0;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: isEven ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1.2 }} className={`flex items-center w-full relative ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className="w-[45%]">
                            <div className={`overflow-hidden bg-white/80 rounded-2xl border border-amber-50 shadow-lg ${isEven ? 'text-right' : 'text-left'}`}>
                              {step.image_url && <img src={step.image_url} className="w-full aspect-video object-cover" alt="" />}
                              <div className="p-4">
                                <div className="text-[9px] font-black text-amber-600 mb-1 flex items-center gap-1"><Clock size={8}/> {step.time}</div>
                                <div className="text-[11px] font-bold uppercase leading-tight" style={{ fontFamily: invitation.font_style }}>{step.activity}</div>
                              </div>
                            </div>
                          </div>
                          <div className="w-[10%] flex justify-center"><div className="w-3 h-3 bg-amber-500 rounded-full ring-4 ring-white shadow-sm z-10" /></div>
                          <div className="w-[45%]" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {invitation.plan_type === 'PREMIUM' && invitation.end_photo_url && (
                <div className="px-2">
                  <div className="rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white rotate-1">
                    <img src={invitation.end_photo_url} className="w-full h-auto" 
                         style={{ transform: `translate(${invitation.end_photo_url_pos_x || 0}px, ${invitation.end_photo_url_pos_y || 0}px) scale(${invitation.end_photo_url_scale || 1})` }} />
                  </div>
                </div>
              )}

              <div className="bg-gray-900 rounded-[3rem] p-8 shadow-2xl">
                {!isSubmitted ? (
                  <form onSubmit={handleRSVP} className="space-y-6">
                    <h3 className="font-black uppercase tracking-widest text-xs text-white text-center">{t.confirm_rsvp}</h3>
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl">
                      <button type="button" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-12 h-12 bg-white/10 text-white rounded-xl font-black">-</button>
                      <span className="text-white font-black text-2xl">{guestCount}</span>
                      <button type="button" onClick={() => setGuestCount(guestCount + 1)} className="w-12 h-12 bg-white/10 text-white rounded-xl font-black">+</button>
                    </div>
                    {guests.map((guest, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3">
                        <input required placeholder={t.first_name} className="bg-white/10 h-12 px-4 rounded-xl text-sm text-white focus:ring-1 ring-amber-400 outline-none" value={guest.firstName} onChange={e => { const n = [...guests]; n[i].firstName = e.target.value; setGuests(n); }} />
                        <input required placeholder={t.last_name} className="bg-white/10 h-12 px-4 rounded-xl text-sm text-white focus:ring-1 ring-amber-400 outline-none" value={guest.lastName} onChange={e => { const n = [...guests]; n[i].lastName = e.target.value; setGuests(n); }} />
                      </div>
                    ))}
                    <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-white text-gray-900 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                      {isSubmitting ? "..." : t.send}
                    </button>
                  </form>
                ) : (
                  <div className="py-6 text-center space-y-4">
                    <CheckCircle2 size={40} className="text-amber-400 mx-auto" />
                    <p className="text-white font-black uppercase text-sm">{t.thank_you}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}