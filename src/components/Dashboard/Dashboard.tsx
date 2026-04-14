import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { translations, Language } from '../../lib/i18n';
import { Plus, Calendar, Eye, CreditCard as Edit, LogOut, Trash2, Copy, Loader2, Users, X } from 'lucide-react';

type Invitation = Database['public']['Tables']['invitations']['Row'] & {
  response_count?: number; 
};

interface GuestResponse {
  group_leader_name: string;
  total_guests: number;
  guest_details: any;
}

interface DashboardProps {
  onCreateNew: () => void;
  onEdit: (invitationId: string) => void;
}

export function Dashboard({ onCreateNew, onEdit }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponses, setSelectedResponses] = useState<GuestResponse[] | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
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
  }, [user]);

  const t = translations[lang].dashboard;
  const tAuth = translations[lang].sidebar;

  const loadInvitations = async () => {
    if (!user) return;
    try {
      const { data: invs, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invError) throw invError;

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

  const fetchResponses = async (invitationId: string) => {
    const { data, error } = await supabase
      .from('responses')
      .select('group_leader_name, total_guests, guest_details')
      .eq('invitation_id', invitationId);
    
    if (!error && data) {
      setSelectedResponses(data);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette invitation ?' : 'Delete this invitation?')) return;
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) throw error;
      setInvitations(prev => prev.filter(inv => inv.id !== id));
    } catch (error: any) {
      alert("Erreur : " + error.message);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(url);
    alert(lang === 'fr' ? 'Lien copié !' : 'Link copied!');
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-gray-50 to-white scrollbar-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-0 pb-32">
        
        {/* --- TOP BAR --- */}
        <div className="relative flex items-center justify-center border-b border-gray-100 mb-8 pt-8 pb-4">
          <div className="absolute left-0 -ml-14">
            <img 
              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" 
              alt="Logo Invit Studio" 
              className="h-24 w-auto object-contain" 
            />
          </div>

          <h1 className="text-2xl font-serif tracking-tight text-gray-900 whitespace-nowrap">
            Invit Studio
          </h1>

          <div className="absolute right-0">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-gray-400 hover:text-rose-500 transition-colors text-[10px] sm:text-[11px] font-bold uppercase tracking-widest px-2 py-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">{tAuth.logout}</span>
            </button>
          </div>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
            <button
              onClick={onCreateNew}
              className="min-h-[250px] sm:min-h-[300px] bg-white rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-100 hover:border-amber-400 hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-14 h-14 sm:w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center group-hover:bg-amber-400 group-hover:text-white transition-all shadow-sm">
                <Plus className="w-7 h-7 sm:w-8 h-8" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                {t.new_creation}
              </span>
            </button>

            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="h-40 sm:h-44 relative bg-gray-50 overflow-hidden">
                  {invitation.main_photo_url ? (
                    <img src={invitation.main_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 font-bold text-[10px] uppercase tracking-widest">
                      {t.preview}
                    </div>
                  )}
                  <button 
                    onClick={() => fetchResponses(invitation.id)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-amber-400 hover:text-white transition-all group"
                  >
                    <Users className="w-4 h-4 text-amber-500 group-hover:text-white" />
                    <span className="text-[10px] font-black">{invitation.response_count || 0}</span>
                  </button>
                </div>

                <div className="p-6 sm:p-8 flex flex-col flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate mb-2">{invitation.title}</h3>
                  <div className="mt-auto space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => onEdit(invitation.id)} className="col-span-2 py-3 bg-gray-900 text-white rounded-2xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Edit className="w-3 h-3" /> {t.edit}</button>
                      <button onClick={() => window.open(`/invite/${invitation.id}`, '_blank')} className="py-3 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 border border-gray-100"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(invitation.id)} className="py-3 bg-rose-50 text-rose-300 rounded-2xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 border border-rose-100"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => handleCopyLink(invitation.id)} className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 border border-amber-100">
                      <Copy className="w-3 h-3" /> {t.share}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE RÉPONSES */}
        {isViewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    {lang === 'fr' ? 'Liste des invités' : lang === 'vi' ? 'Danh sách khách' : 'Guest List'}
                  </h3>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                    {lang === 'fr' ? 'Confirmations reçues' : lang === 'vi' ? 'Xác nhận đã nhận' : 'Confirmations received'}
                  </p>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X /></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {selectedResponses?.length === 0 ? (
                  <p className="text-center py-10 text-gray-400 font-medium">
                    {lang === 'fr' ? 'Aucune réponse pour le moment.' : 'No responses yet.'}
                  </p>
                ) : (
                  selectedResponses?.map((resp, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">{resp.group_leader_name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                          {resp.total_guests} {lang === 'fr' ? 'personne(s)' : lang === 'vi' ? 'người' : 'guest(s)'}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Users className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 relative z-10">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}
      </div>
    </div>
  );
}