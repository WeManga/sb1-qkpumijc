import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { translations, Language } from '../../lib/i18n';
import { LanguageSelector } from '../LanguageSelector';
import { supabase } from '../../lib/supabase';

const BRAND_FONT_LINK_ID = 'invit-studio-brand-font';

const brandTitleStyle: CSSProperties = {
  fontFamily: '"Great Vibes", cursive',
  fontWeight: 400,
  letterSpacing: '0',
  color: '#c7a068',
  textShadow:
    '0 1px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(92,62,28,0.28), 0 10px 22px rgba(0,0,0,0.16)'
};

const authSlogans: Record<Language, string> = {
  en: 'Create with ease, invite with elegance.',
  fr: 'Créez facilement, invitez avec élégance.',
  vi: 'Tạo thiệp dễ dàng, mời khách tinh tế.'
};

const privacyLinkLabels: Record<Language, string> = {
  en: 'Privacy Policy',
  fr: 'Politique de confidentialité',
  vi: 'Chính sách quyền riêng tư'
};

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('invite_lang') as Language) || 'en'
  );

  useEffect(() => {
    if (!document.getElementById(BRAND_FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = BRAND_FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('invite_lang', newLang);
  };

  const t = translations[lang].auth;

  const textOr = lang === 'vi' ? 'Hoặc' : lang === 'en' ? 'Or' : 'Ou';
  const textGoogle =
    t.google_btn ||
    (lang === 'vi'
      ? 'Tiếp tục với Google'
      : lang === 'en'
        ? 'Continue with Google'
        : 'Continuer avec Google');

  const slogan = authSlogans[lang] || authSlogans.en;
  const privacyLabel = privacyLinkLabels[lang] || privacyLinkLabels.en;

  const handleSubmit = async (e: FormEvent) => {
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

  const handleGoogleSignIn = async () => {
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.error_default);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex flex-col items-center justify-center p-4 overflow-x-hidden">
      <div className="fixed top-6 right-6 z-50">
        <LanguageSelector currentLang={lang} onLangChange={handleLangChange} />
      </div>

      <div className="w-full max-w-md flex flex-col items-center -mt-10">
        <div className="text-center flex flex-col items-center w-full">
          <div className="w-[700px] h-[350px] mb-0 p-0 flex items-center justify-center">
            <img
              src="https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/logo.png%20(2).png"
              alt="Logo Invit Studio"
              className="w-full h-full object-contain scale-150"
            />
          </div>

          <h1
            className="text-[4.25rem] sm:text-[4.75rem] leading-none -mt-16 mb-2 relative z-10"
            style={brandTitleStyle}
          >
            Invit Studio
          </h1>

          <p className="text-gray-500 font-light italic tracking-widest text-sm mb-12">
            {slogan}
          </p>
        </div>

        <div className="backdrop-blur-lg bg-white/60 rounded-3xl shadow-2xl border border-white/40 p-8 w-full relative z-20">
          <div className="flex gap-2 mb-8 bg-gray-100/50 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                isLogin ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.login_tab}
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                !isLogin ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-amber-300 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-rose-400 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? t.loading : isLogin ? t.login_btn : t.signup_btn}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-bold">{textOr}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold shadow-sm hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-5 h-5"
                alt="Google"
              />
              {textGoogle}
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/privacy-policy'}
              className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-amber-600 transition-colors pt-2"
            >
              {privacyLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
