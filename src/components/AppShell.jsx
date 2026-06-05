import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import LanternIcon from './LanternIcon';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { path: '/',        label: 'Oracle Board', icon: null,  title: 'The Oracle' },
  { path: '/places',  label: 'Places',       icon: '📍',  title: 'The Map' },
  { path: '/people',  label: 'People',       icon: '👁️', title: 'The Court' },
  { path: '/trips',   label: 'Trips',        icon: '🌙',  title: 'The Journey' },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { workspaceInfo } = useWorkspace();
  const location = useLocation();
  const [showCode, setShowCode] = useState(false);
  const [copied,   setCopied]   = useState(false);

  const currentPage = NAV_ITEMS.find(n =>
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  );

  const copyCode = () => {
    navigator.clipboard.writeText(workspaceInfo?.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const memberCount = workspaceInfo?.members?.length || 1;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>

          <div className={styles.brand}>
            <LanternIcon className={styles.brandLantern} />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>The Goldenest Lantern</span>
              <span className={styles.brandSub}>New Orleans Oracle</span>
            </div>
          </div>

          {currentPage && (
            <div className={styles.pageTitle}>
              <span className={styles.pageTitleIcon}>{currentPage.icon}</span>
              <span>{currentPage.title}</span>
            </div>
          )}

          <div className={styles.userArea}>
            {/* Invite code / members badge */}
            {workspaceInfo && (
              <div className={styles.workspaceBadge}>
                <button
                  className={styles.membersBtn}
                  onClick={() => setShowCode(s => !s)}
                  title="Lantern members & invite code"
                >
                  <LanternIcon className={styles.membersIcon} />
                  <span className={styles.membersCount}>{memberCount}</span>
                </button>

                {showCode && (
                  <div className={styles.codePopover}>
                    <div className={styles.codePopoverArrow} />
                    <p className={styles.codeLabel}>Invite Code</p>
                    <div className={styles.codeRow}>
                      <span className={styles.codeValue}>{workspaceInfo.inviteCode}</span>
                      <button className={styles.copyBtn} onClick={copyCode}>
                        {copied ? '✓' : '⧉'}
                      </button>
                    </div>
                    <p className={styles.codeHint}>
                      Share this code with your partner so they can join.
                    </p>
                    {workspaceInfo.memberNames && (
                      <div className={styles.memberList}>
                        {Object.values(workspaceInfo.memberNames).map((name, i) => (
                          <span key={i} className={styles.memberName}>
                            {name === user.displayName ? `${name} (you)` : name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className={styles.avatar}
                title={user.displayName}
              />
            )}
            <button className={styles.signOutBtn} onClick={logout} title="Sign out">
              ✦ Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Dismiss popover on outside click */}
      {showCode && (
        <div className={styles.popoverBackdrop} onClick={() => setShowCode(false)} />
      )}

      <main className={styles.main}>{children}</main>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <span className={styles.navIcon}>
              {item.icon === null
                ? <LanternIcon className={styles.navLanternIcon} />
                : item.icon}
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
