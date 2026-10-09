// Rarity definitions per TCG. Order is hand-maintained (rarest
// first); never sort alphabetically.

export interface RarityOption {
  value: string;
  label: string;
  code: string;
  description: string;
}

function makeRarity(code: string, description: string): RarityOption {
  return {
    value: code,
    code,
    description,
    label: `${code}  —  ${description}`
  };
}

export const OP_RARITIES: RarityOption[] = [
  makeRarity('SEC', 'Secret Rare'),
  makeRarity('P-SEC', 'Parallel Secret Rare'),
  makeRarity('SR', 'Super Rare'),
  makeRarity('P-SR', 'Parallel Super Rare'),
  makeRarity('R', 'Rare'),
  makeRarity('P-R', 'Parallel Rare'),
  makeRarity('L', 'Leader'),
  makeRarity('P-L', 'Parallel Leader'),
  makeRarity('SP', 'Special'),
  makeRarity('UC', 'Uncommon'),
  makeRarity('P-UC', 'Parallel Uncommon'),
  makeRarity('C', 'Common'),
  makeRarity('P-C', 'Parallel Common'),
  makeRarity('P', 'Promo')
];

export const HOLOLIVE_RARITIES: RarityOption[] = [
  makeRarity('OUR', 'Oshi Ultra Rare'),
  makeRarity('OSR', 'Oshi Super Rare'),
  makeRarity('UR', 'Ultra Rare'),
  makeRarity('SR', 'Special Rare'),
  makeRarity('RR', 'Double Rare'),
  makeRarity('HR', 'Holomem Rare'),
  makeRarity('R', 'Rare'),
  makeRarity('S', 'Special'),
  makeRarity('U', 'Uncommon'),
  makeRarity('OC', 'Oshi Common'),
  makeRarity('C', 'Common'),
  makeRarity('SY', 'Signature Yell'),
  makeRarity('SEC', 'Secret'),
  makeRarity('P', 'Promo')
];

export const COMMON_RARITIES: RarityOption[] = [
  makeRarity('SEC', 'Secret Rare'),
  makeRarity('UR', 'Ultra Rare'),
  makeRarity('SR', 'Super Rare'),
  makeRarity('RR', 'Double Rare'),
  makeRarity('R', 'Rare'),
  makeRarity('UC', 'Uncommon'),
  makeRarity('U', 'Uncommon'),
  makeRarity('C', 'Common'),
  makeRarity('P', 'Promo')
];

export function getRaritiesForTcg(tcgSlug: string | null): RarityOption[] {
  if (!tcgSlug) return [];
  const slug = tcgSlug.toLowerCase();
  if (slug === 'opc' || slug === 'onepiece') return OP_RARITIES;
  if (slug === 'hocg' || slug === 'hololive') return HOLOLIVE_RARITIES;
  return COMMON_RARITIES;
}
