import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className={styles.wrapper}>
      <div className={styles.lanternGlow} />

      <div className={styles.card}>
        {/* Decorative top ornament */}
        <div className={styles.ornament}>
          <span className={styles.star}>✦</span>
          <span className={styles.line} />
          <span className={styles.star}>✦</span>
        </div>

        <div className={styles.lanternIcon}><LanternIconSvg /></div>

        <h1 className={styles.title}>The Goldenest Lantern</h1>
        <p className={styles.subtitle}>
          <em>Your oracle for the Crescent City</em>
        </p>

        <div className={styles.divider}>
          <span>✦ New Orleans ✦</span>
        </div>

        <p className={styles.tagline}>
          Every trip guided by memory, magic, and a little mystery.
          Sign in to consult the lantern.
        </p>

        <button className={styles.googleBtn} onClick={login}>
          <GoogleIcon />
          Sign in with Google
        </button>

        <div className={styles.ornamentBottom}>
          <span className={styles.star}>✦</span>
          <span className={styles.line} />
          <span className={styles.moon}>☽</span>
          <span className={styles.line} />
          <span className={styles.star}>✦</span>
        </div>
      </div>
    </div>
  );
}

function LanternIconSvg() {
  return (
    <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass" x1="60" y1="25" x2="60" y2="115" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF9CC" stopOpacity="0.7" />
          <stop offset="1" stopColor="#5C94E0" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="flame" cx="60" cy="72" r="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF29D" />
          <stop offset="0.35" stopColor="#FFD14D" />
          <stop offset="1" stopColor="#F28F3B" />
        </radialGradient>
      </defs>
      <path d="M36 18h48v18H36z" fill="#17294D" />
      <path d="M39 14c0-4 3.6-8 8-8h26c4.4 0 8 4 8 8v6H39v-6Z" fill="#17294D" />
      <path d="M38 20c0-5.5 4.5-10 10-10h24c5.5 0 10 4.5 10 10" fill="none" stroke="#1A274F" strokeWidth="6" strokeLinecap="round" />
      <path d="M25 38c0-10 8-18 18-18h36c10 0 18 8 18 18v82c0 10-8 18-18 18H43c-10 0-18-8-18-18V38Z" fill="url(#glass)" stroke="#1A274F" strokeWidth="6" />
      <path d="M38 98h44v10H38z" fill="#1A274F" />
      <path d="M44 46h6v54h-6zm14 0h6v54h-6zm14 0h6v54h-6z" fill="#1A274F" />
      <path d="M52 62c0-7 5.5-14 12-14s12 7 12 14c0 9-8.5 16-10.5 22-1.5 5.5 1.5 9.5 3.5 11.5 2 2 0.5 4.5-2.5 4.5-3 0-4.5-1.5-5.5-4.5-1-3-2.5-6.5-2.5-10 0-5-4-8-4-12Z" fill="url(#flame)" />
      <path d="M25 40c0 6.5 8 12 18 12s18-5.5 18-12" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
