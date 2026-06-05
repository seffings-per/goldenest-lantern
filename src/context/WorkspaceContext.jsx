import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getUserWorkspace, createWorkspace, joinWorkspace, getWorkspaceInfo } from '../lib/db';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspaceId,   setWorkspaceId]   = useState(undefined); // undefined = loading
  const [workspaceInfo, setWorkspaceInfo] = useState(null);
  const [error, setError] = useState('');

  // Resolve workspace whenever the logged-in user changes
  useEffect(() => {
    if (!user) { setWorkspaceId(null); return; }

    getUserWorkspace(user.uid).then(async (wsId) => {
      if (wsId) {
        setWorkspaceId(wsId);
        const info = await getWorkspaceInfo(wsId);
        setWorkspaceInfo(info);
      } else {
        setWorkspaceId(null); // null = authenticated but no workspace yet
      }
    });
  }, [user]);

  const handleCreate = async () => {
    setError('');
    try {
      const wsId = await createWorkspace(user.uid, user.displayName);
      const info = await getWorkspaceInfo(wsId);
      setWorkspaceId(wsId);
      setWorkspaceInfo(info);
    } catch (e) {
      setError(e.message || 'Could not create workspace.');
    }
  };

  const handleJoin = async (code) => {
    setError('');
    try {
      const wsId = await joinWorkspace(user.uid, user.displayName, code);
      const info = await getWorkspaceInfo(wsId);
      setWorkspaceId(wsId);
      setWorkspaceInfo(info);
    } catch (e) {
      setError(e.message || 'Could not join workspace.');
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaceId,
      workspaceInfo,
      error,
      onCreate: handleCreate,
      onJoin:   handleJoin,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
