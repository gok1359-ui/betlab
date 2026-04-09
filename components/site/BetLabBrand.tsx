export default function BetLabBrand() {
  return (
    <div className="site-brand">
      <span className="site-brand-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="site-brand-icon-svg" role="img">
          <defs>
            <linearGradient id="betlabLogoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="55%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <rect x="6" y="10" width="52" height="44" rx="14" fill="url(#betlabLogoGradient2)" opacity="0.16" />
          <path
            d="M20 42V23h12.5c5.1 0 8.3 2.4 8.3 6.1 0 2.1-1.1 3.9-3 4.8 2.7.8 4.3 2.9 4.3 5.7 0 4-3.4 6.4-9 6.4H20Zm6.1-11.4h5.4c2.1 0 3.3-.9 3.3-2.5s-1.2-2.4-3.3-2.4h-5.4v4.9Zm0 6.8H33c2.3 0 3.6-.9 3.6-2.6s-1.3-2.7-3.6-2.7h-6.9v5.3Z"
            fill="white"
          />
          <circle cx="49" cy="19" r="4.5" fill="url(#betlabLogoGradient2)" />
        </svg>
      </span>

      <span className="site-brand-text">
        <span className="site-brand-title">BetLab</span>
        <span className="site-brand-subtitle">Sports Analysis Platform</span>
      </span>
    </div>
  );
}
