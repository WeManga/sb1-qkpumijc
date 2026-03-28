import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { translations, Language } from '../../lib/i18n';
import { Plus, Calendar, Eye, CreditCard as Edit, LogOut, Trash2, Copy, Loader2, Sparkles, Users } from 'lucide-react';

type Invitation = Database['public']['Tables']['invitations']['Row'] & {
  response_count?: number; // On ajoute un champ virtuel pour le compteur
};

interface DashboardProps {
  onCreateNew: () => void;
  onEdit: (invitationId: string) => void;
}

export function Dashboard({ onCreateNew, onEdit }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('invite_lang') as Language) || 'en'
  );

  useEffect(() => {
    loadInvitations();
    const handleStorageChange = () => {
      const savedLang = localStorage.getItem('invite_lang') as Language;
      if (savedLang) setLang(savedLang);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = translations[lang].dashboard;
  const tAuth = translations[lang].sidebar;

  const loadInvitations = async () => {
    if (!user) return;
    try {
      // 1. Charger les invitations
      const { data: invs, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      // 2. Charger le compte des réponses pour chaque invitation
      const invsWithCounts = await Promise.all((invs || []).map(async (inv) => {
        const { count } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('invitation_id', inv.id);
        
        return { ...inv, response_count: count || 0 };
      }));

      setInvitations(invsWithCounts);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette invitation ?')) return;
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) throw error;
      setInvitations(prev => prev.filter(inv => inv.id !== id));
    } catch (error: any) {
      alert("Erreur : " + error.message);
    }
  };

  // --- CORRECTION DU LIEN ICI ---
  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(url);
    alert('Lien copié avec succès !');
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-gray-50 to-white scrollbar-hide">
      <div className="max-w-7xl mx-auto px-6 py-10 pb-32">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-16 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-gray-900">InviteStudio</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-gray-400 hover:text-rose-500 transition-colors text-[11px] font-bold uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4" />
              {tAuth.logout}
            </button>
          </div>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
            {t.welcome}
          </h1>
          <div className="w-12 h-1 bg-amber-400 mx-auto rounded-full" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <button
              onClick={onCreateNew}
              className="min-h-[300px] bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center group-hover:bg-amber-400 group-hover:text-white transition-all shadow-sm">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                {t.new_creation}
              </span>
            </button>

            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="h-44 relative bg-gray-50 overflow-hidden">
                  {invitation.main_photo_url ? (
                    <img src={invitation.main_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 font-bold text-[10px] uppercase tracking-widest">
                      {t.preview}
                    </div>
                  )}
                  
                  {/* COMPTEUR DE RÉPONSES */}
                  <div className="absolute top-4 left-4">
                    <div className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-[9px] font-bold flex items-center gap-2 shadow-lg">
                      <Users className="w-3 h-3 text-amber-400" />
                      {invitation.response_count} CONFIRMÉ(S)
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[9px] font-bold uppercase text-gray-400 border border-gray-100">
                      {invitation.event_type || 'Event'}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 truncate mb-2">
                    {invitation.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400 mb-8">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span className="text-xs font-medium tracking-tight">
                      {invitation.event_date ? new Date(invitation.event_date).toLocaleDateString() : '---'}
                    </span>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => onEdit(invitation.id)}
                        className="col-span-2 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="w-3 h-3" /> {t.edit}
                      </button>
                      
                      <button
                        onClick={() => window.open(`/invite/${invitation.id}`, '_blank')}
                        className="py-3 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 border border-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(invitation.id)}
                        className="py-3 bg-rose-50 text-rose-300 rounded-2xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 border border-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopyLink(invitation.id)}
                      className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 border border-amber-100"
                    >
                      <Copy className="w-3 h-3" /> {t.share}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}