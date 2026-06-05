import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import styles from './WorkspaceSetup.module.css';

export default function WorkspaceSetup() {
  const { user, logout } = useAuth();
  const { onCreate, onJoin, error } = useWorkspace();
  const [mode,       setMode]       = useState(null); // 'create' | 'join'
  const [code,       setCode]       = useState('');
  const [working,    setWorking]    = useState(false);

  const handleCreate = async () => {
    setWorking(true);
    await onCreate();
    setWorking(false);
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setWorking(true);
    await onJoin(code);
    setWorking(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.glow} />

      <div className={styles.card}>
        <div className={styles.ornament}>
          <span className={styles.star}>✦</span>
          <span className={styles.line} />
          <span className={styles.moon}>☽</span>
          <span className={styles.line} />
          <span className={styles.star}>✦</span>
        </div>

        <div className={styles.lantern}>🏮</div>
        <h1 className={styles.title}>The Goldenest Lantern</h1>

        <div className={styles.greeting}>
          <img src={user.photoURL} alt="" className={styles.avatar} />
          <p className={styles.greetingText}>
            Welcome, <strong>{user.displayName?.split(' ')[0]}</strong>.
            <br />
            <span>Set up your shared lantern to get started.</span>
          </p>
        </div>

        <div className={styles.divider}>
          <span>✦ Your Lantern ✦</span>
        </div>

        {!mode && (
          <div className={styles.choices}>
            <button className={styles.choiceBtn} onClick={() => setMode('create')}>
              <span className={styles.choiceIcon}>🏮</span>
              <span className={styles.choiceLabel}>Create a New Lantern</span>
              <span className={styles.choiceSub}>Start fresh — you'll get an invite code to share with Chris</span>
            </button>
            <button className={styles.choiceBtn} onClick={() => setMode('join')}>
              <span className={styles.choiceIcon}>🔮</span>
              <span className={styles.choiceLabel}>Join an Existing Lantern</span>
              <span className={styles.choiceSub}>Enter the invite code your partner already created</span>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className={styles.modePanel}>
            <p className={styles.modeDesc}>
              This creates your shared lantern. Once it's set up, you'll see an invite code on the
              home screen — share it with Chris so they can join.
            </p>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.btnRow}>
              <button className="btn btn-ghost" onClick={() => setMode(null)} disabled={working}>
                ← Back
              </button>
              <button className="btn btn-gold" onClick={handleCreate} disabled={working}>
                {working ? '✦ Creating…' : '✦ Light the Lantern'}
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className={styles.modePanel}>
            <p className={styles.modeDesc}>
              Enter the 6-character invite code from your partner's lantern.
            </p>
            <input
              className={`form-input ${styles.codeInput}`}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.btnRow}>
              <button className="btn btn-ghost" onClick={() => setMode(null)} disabled={working}>
                ← Back
              </button>
              <button className="btn btn-gold" onClick={handleJoin}
                disabled={working || code.trim().length < 6}>
                {working ? '✦ Joining…' : '✦ Enter the Lantern'}
              </button>
            </div>
          </div>
        )}

        <button className={styles.signOut} onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
