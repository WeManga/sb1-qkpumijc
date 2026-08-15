import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Clé localStorage utilisée pour retrouver, après une connexion/inscription réelle
// (avec ou sans redirection OAuth), l'ID de la session invité dont il faut
// rattacher les invitations.
const GUEST_CLAIM_STORAGE_KEY = 'invit_studio_pending_guest_claim';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Évite un double appel de la réclamation (StrictMode, multiples événements auth).
  const claimInProgressRef = useRef(false);

  const ensureProfile = async (currentUser: User | null) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: currentUser.id,
          plan_type: 'FREE',
          plan_package: 'free',
          max_invitations: 1
        } as any,
        { onConflict: 'id', ignoreDuplicates: true }
      );
    if (error) {
      console.error('Profile creation failed:', error.message);
    }
  };

  // Si une invitation "invité" est en attente de récupération (après connexion/inscription
  // suite à un clic sur "S'enregistrer"), on la rattache au compte qui vient de se connecter.
  // Appelée AVANT setUser() pour que le Dashboard ne recharge les invitations
  // qu'une fois le rattachement terminé.
  const claimPendingGuestInvitations = async (currentUser: User | null) => {
    if (!currentUser || (currentUser as any).is_anonymous) return;

    const pendingGuestId = localStorage.getItem(GUEST_CLAIM_STORAGE_KEY);
    if (!pendingGuestId || pendingGuestId === currentUser.id) {
      localStorage.removeItem(GUEST_CLAIM_STORAGE_KEY);
      return;
    }

    if (claimInProgressRef.current) return;
    claimInProgressRef.current = true;

    try {
      const { error } = await supabase.rpc('claim_guest_invitations', {
        p_guest_user_id: pendingGuestId
      });
      if (error) {
        console.error('Claim guest invitations failed:', error.message);
      }
    } finally {
      localStorage.removeItem(GUEST_CLAIM_STORAGE_KEY);
      claimInProgressRef.current = false;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      await ensureProfile(currentUser);
      await claimPendingGuestInvitations(currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const currentUser = session?.user ?? null;
        await ensureProfile(currentUser);
        await claimPendingGuestInvitations(currentUser);
        setUser(currentUser);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Si on est actuellement en session invité, on mémorise son ID avant de
    // basculer vers le compte réel, pour pouvoir lui rattacher ses invitations.
    if ((user as any)?.is_anonymous) {
      localStorage.setItem(GUEST_CLAIM_STORAGE_KEY, user!.id);
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if ((user as any)?.is_anonymous) localStorage.removeItem(GUEST_CLAIM_STORAGE_KEY);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    if ((user as any)?.is_anonymous) {
      localStorage.setItem(GUEST_CLAIM_STORAGE_KEY, user!.id);
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if ((user as any)?.is_anonymous) localStorage.removeItem(GUEST_CLAIM_STORAGE_KEY);
      throw error;
    }
  };

  // Accès "Invité" : crée une session Supabase anonyme réelle (même mécanisme RLS
  // qu'un compte classique), sans email ni mot de passe. Nécessite d'activer
  // "Anonymous Sign-Ins" dans Supabase Dashboard > Authentication.
  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  };

  // Utilisé à la fois pour "Continuer avec Google" classique et pour la conversion
  // d'un compte invité. Le rattachement des invitations se fait au retour de la
  // redirection OAuth, via le marqueur localStorage posé avant l'appel.
  const signInWithGoogle = async () => {
    if ((user as any)?.is_anonymous) {
      localStorage.setItem(GUEST_CLAIM_STORAGE_KEY, user!.id);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      if ((user as any)?.is_anonymous) localStorage.removeItem(GUEST_CLAIM_STORAGE_KEY);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: !!(user as any)?.is_anonymous,
        signIn,
        signUp,
        signInAnonymously,
        signInWithGoogle,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
