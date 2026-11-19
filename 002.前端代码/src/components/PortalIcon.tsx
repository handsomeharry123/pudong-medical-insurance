export default function PortalIcon({ kind }: { kind: 'home' | 'hospital' | 'robot' | 'users' }) {
  if (kind === 'hospital') return <svg className="portal-hospital-mark" viewBox="0 0 160 160" width="32" height="32" aria-hidden="true" focusable="false">
    <circle cx="80" cy="80" r="80" fill="#1261a0" />
    <path d="M66 46a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v12h14a4 4 0 0 1 4 4v58h5v5H43v-5h5V62a4 4 0 0 1 4-4h14z" fill="#fff" />
    <g fill="#1261a0">
      <path d="M76 47h6v5h5v6h-5v5h-6v-5h-5v-6h5z" />
      <rect x="63" y="73" width="11" height="11" rx="2" />
      <rect x="84" y="73" width="11" height="11" rx="2" />
      <rect x="63" y="89" width="11" height="11" rx="2" />
      <rect x="84" y="89" width="11" height="11" rx="2" />
      <rect x="73" y="104" width="11" height="16" rx="1" />
    </g>
  </svg>;
  return <svg viewBox="0 0 48 48" width="32" height="32" fill="currentColor" aria-hidden="true" focusable="false">
    {kind === 'home' ? <>
      <path d="M4 22 22 6a3 3 0 0 1 4 0l18 16-3 4-4-3v18H11V23l-4 3z" />
      <path d="M20 29h8v12h-8z" fill="#2469e8" />
    </> : kind === 'robot' ? <>
      <path d="M24 7v13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="6" r="2.5" />
      <rect x="7" y="13" width="34" height="28" rx="11" />
      <rect x="3" y="22" width="3" height="10" rx="1.5" />
      <rect x="42" y="22" width="3" height="10" rx="1.5" />
      <circle cx="18" cy="25" r="3" fill="#5358d9" /><circle cx="30" cy="25" r="3" fill="#5358d9" />
      <path d="M16 33h4v2.5h-4zm6 0h4v2.5h-4zm6 0h4v2.5h-4z" fill="#5358d9" />
    </> : <>
      <circle cx="21" cy="15" r="6" /><circle cx="9" cy="19" r="4" /><path d="M10 37v-5a11 11 0 0 1 22 0v5zM1 35v-5a8 8 0 0 1 9-8 14 14 0 0 0-3 10v3z" />
      <g transform="translate(34 31)"><path d="m-3-11 6 0 1 4 4-1 3 5-3 3 3 3-3 5-4-1-1 4h-6l-1-4-4 1-3-5 3-3-3-3 3-5 4 1z" stroke="#0d918b" strokeWidth="2" /><circle r="3.5" fill="#0d918b" /></g>
    </>}
  </svg>;
}

