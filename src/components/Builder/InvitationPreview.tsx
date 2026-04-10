export function InvitationPreview({ invitation }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());

  useEffect(() => {
    if (invitation.music_url) { audio.src = invitation.music_url; audio.loop = true; }
    return () => audio.pause();
  }, [invitation.music_url]);

  const toggleMusic = () => { if (isPlaying) audio.pause(); else audio.play(); setIsPlaying(!isPlaying); };

  return (
    <div className="relative w-full max-w-md mx-auto bg-white rounded-[3rem] overflow-hidden min-h-[800px] border-[8px] border-white shadow-2xl">
      
      {/* PLUIE D'EMOJIS */}
      <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="animate-fall" style={{ left: `${(i * 7) % 100}%`, animationDuration: `${3 + (i % 4)}s`, animationDelay: `${i * 0.5}s`, fontSize: '24px' }}>
            {invitation.event_type === 'wedding' ? '❤️' : '✨'}
          </div>
        ))}
      </div>

      {/* DISQUE VINYLE ANIMÉ */}
      {invitation.music_url && (
        <div className="absolute top-6 right-6 z-50">
          <button onClick={toggleMusic} className={`w-16 h-16 bg-[#1D1D1F] rounded-full border-2 border-white/20 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-disk-spin' : ''}`}>
            <div className="w-6 h-6 bg-[#3A3A3C] rounded-full flex items-center justify-center">
              <Music size={12} className="text-amber-400" />
            </div>
          </button>
        </div>
      )}

      {/* PHOTO AVEC POSITION X/Y */}
      <div className="h-[40vh] relative overflow-hidden">
        <img src={invitation.main_photo_url} className="w-full h-full object-cover" 
             style={{ objectPosition: `${invitation.photo_pos_x || 50}% ${invitation.photo_pos_y || 50}%` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* CARTE TEXTE AVEC TEXTURE PAPIER */}
      <div className="px-6 pb-12 -mt-16 relative z-10">
        <div className={`rounded-[2.5rem] p-8 text-center space-y-6 ${
          invitation.paper_type === 'parchment' ? 'paper-parchment' : 
          invitation.paper_type === 'grainy' ? 'paper-grainy' : 
          invitation.paper_type === 'cotton' ? 'paper-cotton' : 'paper-smooth'
        }`}>
          <h1 className="text-4xl font-bold" style={{ fontFamily: invitation.font_style }}>{invitation.title || "Titre"}</h1>
          <p className="opacity-70 italic">{invitation.host_names || "Hôtes"}</p>
        </div>
      </div>
    </div>
  );
}