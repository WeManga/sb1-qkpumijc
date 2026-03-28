import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function Router({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a Router');
  }
  return context;
}

export function useParams() {
  const { currentPath } = useRouter();
  const pathParts = currentPath.split('/').filter(Boolean);

  if (pathParts[0] === 'invite' && pathParts[1]) {
    return { slug: pathParts[1] };
  }

  return {};
}

interface RouteProps {
  path: string;
  element: ReactNode;
}

export function Route({ path, element }: RouteProps) {
  const { currentPath } = useRouter();

  if (path === '*') {
    return <>{element}</>;
  }

  const pathPattern = path.replace(/:[^/]+/g, '[^/]+');
  const regex = new RegExp(`^${pathPattern}$`);

  if (regex.test(currentPath)) {
    return <>{element}</>;
  }

  return null;
}

export function Routes({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
