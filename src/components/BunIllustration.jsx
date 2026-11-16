const ACCESSOIRES = {
  classique: (
    <g>
      <path d="M60 34c1-7 5-10 10-11" stroke="#8CB98A" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M64 30c4-2 8-1 10 2-4 2-8 1-10-2z" fill="#8CB98A" />
      <path d="M60 36c-4-1-7-4-7-8 4 0 7 3 7 8z" fill="#8CB98A" opacity="0.85" />
    </g>
  ),
  porc: (
    <g>
      <path d="M78 30c5 4 6 8 3 11-4 3-8-1-7-5 0-3 2-5 4-6z" fill="#E8A64C" />
      <circle cx="78" cy="35" r="1.6" fill="#FFF8F3" opacity="0.8" />
    </g>
  ),
  poulet: (
    <g>
      <path d="M76 30c5 4 6 8 3 11-4 3-8-1-7-5 0-3 2-5 4-6z" fill="#E8A64C" />
      <path d="M44 30c-6-3-10-1-11 3 4 3 9 2 11-3z" fill="#AFC4D2" />
      <path d="M44 30c2 5 0 9-4 10-1-4 1-8 4-10z" fill="#C3D5E0" />
    </g>
  ),
  marin: (
    <g>
      <path d="M74 82c6-3 12-3 16 0-4 3-10 3-16 0z" fill="#AFC4D2" />
      <path d="M74 82l-5-4v8z" fill="#AFC4D2" />
      <circle cx="87" cy="81" r="1.2" fill="#FFF8F3" />
    </g>
  ),
  veggie: (
    <g>
      <path d="M62 34c0-8 5-12 11-12-1 8-5 12-11 12z" fill="#8CB98A" />
      <path d="M62 34c-6 0-10-3-11-9 6-1 10 3 11 9z" fill="#A6CCA4" />
    </g>
  ),
};

export default function BunIllustration({ variant = 'classique', size = 96, className = '' }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#F0DCDC" opacity="0.55" />
      <circle cx="60" cy="60" r="44" fill="#FFF8F3" />
      <path
        d="M28 68c0-16 14-27 32-27s32 11 32 27c0 6-5 9-11 9H39c-6 0-11-3-11-9z"
        fill="#FFF6EE"
        stroke="#D19A83"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M45 45c-3 6-3 15-2 22" stroke="#EFD6C8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M75 45c3 6 3 15 2 22" stroke="#EFD6C8" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M48 64c2.4-3.2 5.6-3.2 8 0" stroke="#A34A35" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M64 64c2.4-3.2 5.6-3.2 8 0" stroke="#A34A35" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M55 69c2 2.6 8 2.6 10 0" stroke="#A34A35" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="70" r="3.4" fill="#F3BFBA" opacity="0.9" />
      <circle cx="80" cy="70" r="3.4" fill="#F3BFBA" opacity="0.9" />
      {ACCESSOIRES[variant] || ACCESSOIRES.classique}
    </svg>
  );
}