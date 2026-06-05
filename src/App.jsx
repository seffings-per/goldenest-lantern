import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWorkspace } from './context/WorkspaceContext';
import Login from './pages/Login';
import WorkspaceSetup from './pages/WorkspaceSetup';
import AppShell from './components/AppShell';
import OracleBoard from './pages/OracleBoard';
import Places from './pages/Places';
import People from './pages/People';
import Trips from './pages/Trips';

export default function App() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  // Auth still loading, or workspace still resolving
  if (user === undefined || (user && workspaceId === undefined)) {
    return <AppLoading />;
  }

  // Not signed in
  if (!user) return <Login />;

  // Signed in but no workspace yet → setup screen
  if (workspaceId === null) return <WorkspaceSetup />;

  // Fully ready
  return (
    <AppShell>
      <Routes>
        <Route path="/"        element={<OracleBoard />} />
        <Route path="/places"  element={<Places />} />
        <Route path="/people"  element={<People />} />
        <Route path="/trips"   element={<Trips />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function AppLoading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem'
    }}>
      <div style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>🏮</div>
      <p style={{
        fontFamily: 'var(--font-heading)', color: 'var(--gold)',
        letterSpacing: '0.15em', fontSize: '0.8rem'
      }}>
        CONSULTING THE LANTERN…
      </p>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
