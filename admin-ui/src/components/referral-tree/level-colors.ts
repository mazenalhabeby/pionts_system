/** Shared color palette for referral tree levels — cycles for any depth */
export interface LevelColor {
  /** Dot / badge color */
  dot: string;
  /** Card background + border classes */
  card: string;
  cardHover: string;
  /** Top accent bar gradient */
  accent: string;
  /** Avatar wrapper gradient */
  avaWrap: string;
  /** Avatar inner gradient */
  ava: string;
  /** Level badge text + bg */
  lvl: string;
  /** Children connector line color */
  kidsColor: string;
  /** Avatar hover glow */
  avaHover: string;
}

export const LEVEL_COLORS: LevelColor[] = [
  {
    dot: '#ff3c00',
    card: 'bg-accent/5 border border-accent/20',
    cardHover: 'hover:border-accent/40',
    accent: 'bg-linear-to-r from-accent via-accent/40 to-transparent',
    avaWrap: 'bg-linear-to-br from-accent to-[#ffab91]',
    ava: 'bg-linear-to-br from-[#ff5722] to-[#d84315]',
    lvl: 'text-accent bg-accent/10',
    kidsColor: 'border-l-accent/15',
    avaHover: 'group-hover:shadow-[0_0_18px_rgba(255,60,0,0.25)]',
  },
  {
    dot: '#0ea5e9',
    card: 'bg-[#0ea5e9]/5 border border-[#0ea5e9]/20',
    cardHover: 'hover:border-[#0ea5e9]/40',
    accent: 'bg-linear-to-r from-[#0ea5e9] via-[#0ea5e9]/40 to-transparent',
    avaWrap: 'bg-linear-to-br from-[#0ea5e9] to-[#bae6fd]',
    ava: 'bg-linear-to-br from-[#29b6f6] to-[#0277bd]',
    lvl: 'text-[#38bdf8] bg-[#0ea5e9]/10',
    kidsColor: 'border-l-[#0ea5e9]/15',
    avaHover: 'group-hover:shadow-[0_0_18px_rgba(14,165,233,0.25)]',
  },
  {
    dot: '#6366f1',
    card: 'bg-[#6366f1]/5 border border-[#6366f1]/20',
    cardHover: 'hover:border-[#6366f1]/40',
    accent: 'bg-linear-to-r from-[#6366f1] via-[#6366f1]/40 to-transparent',
    avaWrap: 'bg-linear-to-br from-[#6366f1] to-[#ddd6fe]',
    ava: 'bg-linear-to-br from-[#7c4dff] to-[#4527a0]',
    lvl: 'text-[#818cf8] bg-[#6366f1]/10',
    kidsColor: 'border-l-[#6366f1]/15',
    avaHover: 'group-hover:shadow-[0_0_18px_rgba(99,102,241,0.2)]',
  },
  {
    dot: '#8b5cf6',
    card: 'bg-[#8b5cf6]/5 border border-[#8b5cf6]/20',
    cardHover: 'hover:border-[#8b5cf6]/40',
    accent: 'bg-linear-to-r from-[#8b5cf6] via-[#8b5cf6]/40 to-transparent',
    avaWrap: 'bg-linear-to-br from-[#8b5cf6] to-[#ddd6fe]',
    ava: 'bg-linear-to-br from-[#a78bfa] to-[#6d28d9]',
    lvl: 'text-[#a78bfa] bg-[#8b5cf6]/10',
    kidsColor: 'border-l-[#8b5cf6]/15',
    avaHover: 'group-hover:shadow-[0_0_18px_rgba(139,92,246,0.2)]',
  },
  {
    dot: '#ec4899',
    card: 'bg-[#ec4899]/5 border border-[#ec4899]/20',
    cardHover: 'hover:border-[#ec4899]/40',
    accent: 'bg-linear-to-r from-[#ec4899] via-[#ec4899]/40 to-transparent',
    avaWrap: 'bg-linear-to-br from-[#ec4899] to-[#fbcfe8]',
    ava: 'bg-linear-to-br from-[#f472b6] to-[#be185d]',
    lvl: 'text-[#f472b6] bg-[#ec4899]/10',
    kidsColor: 'border-l-[#ec4899]/15',
    avaHover: 'group-hover:shadow-[0_0_18px_rgba(236,72,153,0.2)]',
  },
  {
    dot: '#14b8a6',
    card: 'bg-[#14b8a6]/5 border border-[#14b8a6]/20',
    cardHover: 'hover:border-[#14b8a6]/40',
    accent: 'bg-linear-to-r from-[#14b8a6] via-[#14b8a6]/40 to-transparent',
    avaWrap: 'bg-linear-to-br from-[#14b8a6] to-[#99f6e4]',
    ava: 'bg-linear-to-br from-[#2dd4bf] to-[#0f766e]',
    lvl: 'text-[#2dd4bf] bg-[#14b8a6]/10',
    kidsColor: 'border-l-[#14b8a6]/15',
    avaHover: 'group-hover:shadow-[0_0_18px_rgba(20,184,166,0.2)]',
  },
];
