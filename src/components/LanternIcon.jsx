export default function LanternIcon({ className = '', style }) {
  return (
    <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="glass" x1="60" y1="25" x2="60" y2="115" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF9CC" stopOpacity="0.7" />
          <stop offset="1" stopColor="#5C94E0" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="flame" cx="60" cy="82" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF29D" />
          <stop offset="0.4" stopColor="#FFD14D" />
          <stop offset="1" stopColor="#F28F3B" />
        </radialGradient>
      </defs>
      <path d="M36 18h48v18H36z" fill="#17294D" />
      <path d="M39 14c0-4 3.6-8 8-8h26c4.4 0 8 4 8 8v6H39v-6Z" fill="#17294D" />
      <path d="M38 20c0-5.5 4.5-10 10-10h24c5.5 0 10 4.5 10 10" fill="none" stroke="#1A274F" strokeWidth="6" strokeLinecap="round" />
      <path d="M25 38c0-10 8-18 18-18h36c10 0 18 8 18 18v82c0 10-8 18-18 18H43c-10 0-18-8-18-18V38Z" fill="url(#glass)" stroke="#1A274F" strokeWidth="6" />
      <path d="M38 98h44v10H38z" fill="#1A274F" />
      <path d="M44 46h6v54h-6zm14 0h6v54h-6zm14 0h6v54h-6z" fill="#1A274F" />
      <path d="M60 52C55 62 48 73 48 80C48 88 53 93 60 93C67 93 72 88 72 80C72 73 65 62 60 52Z" fill="url(#flame)" />
      <path d="M25 40c0 6.5 8 12 18 12s18-5.5 18-12" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}
