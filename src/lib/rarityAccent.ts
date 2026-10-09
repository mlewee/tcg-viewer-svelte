// Visual accent for a card's rarity. Used by tiles and the
// inspect modal so foil rims stay consistent.

export interface RarityAccent {
  rim: string;
  glow: string;
  badge: string;
}

export function rarityAccent(rarity: string | null | undefined): RarityAccent {
  const r = (rarity ?? '').toUpperCase();
  if (r.includes('SEC') || r.includes('OUR') || r === 'UR' || r.includes('OSR')) {
    return { rim: 'accent-gold', glow: 'glow-gold', badge: 'badge-gold' };
  }
  if (r.includes('SR') || r === 'SP' || r === 'L' || r.includes('P-L')) {
    return { rim: 'accent-peach', glow: 'glow-peach', badge: 'badge-peach' };
  }
  if (r === 'R' || r.includes('RR') || r.includes('HR') || r.includes('P-R')) {
    return { rim: 'accent-sapphire', glow: 'glow-sapphire', badge: 'badge-sapphire' };
  }
  return { rim: 'accent-plain', glow: 'glow-plain', badge: 'badge-plain' };
}
