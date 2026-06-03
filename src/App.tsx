import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Router, Routes, Route, useRouter, useParams } from './components/Router/Router';
import { AuthPage } from './components/Auth/AuthPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Builder } from './components/Builder/Builder';
import { GuestView } from './components/Guest/GuestView';
import { supabase } from './lib/supabase';

// --- COMPOSANT DE CHARGEMENT POUR L'INVITÉ ---
// Ce composant s'occupe de récupérer les infos de l'invitation via l'ID du lien
function GuestViewLoader() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvitation() {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('id', slug)
          .single();

        if (error) throw error;
        setInvitation(data);
      } catch (err) {
        console.error("Erreur lors du chargement de l'invitation:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Oups !</h2>
        <p className="text-gray-500">Cette invitation est introuvable ou le lien a expiré.</p>
      </div>
    );
  }

  return <GuestView invitation={invitation} />;
}

// --- CONTENU PRINCIPAL DE L'APPLICATION ---
function AppContent() {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();
  const [editingInvitationId, setEditingInvitationId] = useState<string | undefined>();

  useEffect(() => {
    const hideSplash = () => {
      const splash = document.getElementById('creathings-splash');

      if (!splash) return;

      splash.classList.add('creathings-hidden');

      window.setTimeout(() => {
        splash.remove();
      }, 700);
    };

    if (window.location.pathname.startsWith('/invite/')) {
      hideSplash();
      return;
    }

    if (!loading) {
      const timer = window.setTimeout(hideSplash, 700);
      return () => window.clearTimeout(timer);
    }

    const fallbackTimer = window.setTimeout(hideSplash, 3500);
    return () => window.clearTimeout(fallbackTimer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleCreateNew = () => {
    setEditingInvitationId(undefined);
    navigate('/builder');
  };

  const handleEdit = (invitationId: string) => {
    setEditingInvitationId(invitationId);
    navigate('/builder');
  };

  const handleBackToDashboard = () => {
    setEditingInvitationId(undefined);
    navigate('/');
  };

  return (
    <Routes>
      {/* ROUTE PUBLIQUE : Accessible par tout le monde via le lien partagé */}
      <Route
        path="/invite/:slug"
        element={<GuestViewLoader />}
      />

      {/* ROUTE BUILDER : Création/Modification */}
      <Route
        path="/builder"
        element={
          user ? (
            <Builder
              invitationId={editingInvitationId}
              onBack={handleBackToDashboard}
            />
          ) : (
            <AuthPage />
          )
        }
      />

      {/* ROUTE RACINE : Dashboard ou Login */}
      <Route
        path="/"
        element={
          user ? (
            <Dashboard
              onCreateNew={handleCreateNew}
              onEdit={handleEdit}
            />
          ) : (
            <AuthPage />
          )
        }
      />
    </Routes>
  );
}

// --- POINT D'ENTRÉE ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
