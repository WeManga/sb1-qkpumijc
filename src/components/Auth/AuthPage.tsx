import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock } from 'lucide-react';
import { translations, Language } from '../../lib/i18n';
import { LanguageSelector } from '../LanguageSelector';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  // Gestion de la langue
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('invite_lang') as Language) || 'en'
  );

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('invite_lang', newLang);
  };

  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.error_default);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex flex-col items-center justify-center p-4 overflow-x-hidden">
      {/* Sélecteur de langue en haut à droite */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSelector currentLang={lang} onLangChange={handleLangChange} />
      </div>

      <div className="w-full max-w-md flex flex-col items-center -mt-20"> {/* Remontée globale légère */}
        <div className="text-center flex flex-col items-center w-full">
          
          {/* LOGO GÉANT SANS FOND */}
          <div className="w-[700px] h-[350px] mb-0 p-0 flex items-center justify-center">
            <img 
              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png" 
              alt="Logo Invit Studio" 
              className="w-full h-full object-contain scale-150" 
            />
          </div>
          
          {/* TITRE "Invit Studio" COLLÉ AU LOGO, LÉGÈREMENT DESCENDU */}
          <h1 className="text-5xl font-serif tracking-tight text-gray-900 -mt-24 mb-1 relative z-10">
            Invit Studio
          </h1>
          <p className="text-gray-500 font-light italic tracking-widest text-sm mb-10">
            {t.subtitle}
          </p>
        </div>

        <div className="backdrop-blur-lg bg-white/60 rounded-3xl shadow-2xl border border-white/40 p-8 w-full relative z-20">
          <div className="flex gap-2 mb-8 bg-gray-100/50 p-1 rounded-2xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                isLogin
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.login_tab}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.signup_tab}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
                {t.email_label}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-amber-300 outline-none transition-all text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-1">
                {t.password_label}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-amber-300 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-medium animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-rose-400 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? t.loading : (isLogin ? t.login_btn : t.signup_btn)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}