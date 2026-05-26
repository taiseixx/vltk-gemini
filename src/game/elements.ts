export function getSectIdFromColor(color: string): string {
  if (color === '#e67e22') return 'sl'; // Thiếu Lâm
  if (color === '#3498db') return 'vd'; // Võ Đang
  if (color === '#27ae60') return 'cb'; // Cái Bang
  if (color === '#e91e63') return 'nm'; // Nga Mi
  if (color === '#f39c12') return 'cl'; // Côn Lôn
  if (color === '#9b59b6') return 'nd'; // Ngũ Độc
  if (color === '#8a2be2') return 'tm'; // Đường Môn
  if (color === '#00bcd4') return 'ty'; // Thủy Yên/Thúy Yên
  if (color === '#f44336') return 'tv'; // Thiên Vương
  if (color === '#d35400') return 'tn'; // Thiên Nhẫn
  return '';
}

export function getSectElement(sectId: string): 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth' {
  const sectElementMap: Record<string, 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth'> = {
    sl: 'Metal',
    tv: 'Metal',
    cb: 'Fire',
    tn: 'Fire',
    tm: 'Wood',
    nd: 'Wood',
    vd: 'Earth',
    cl: 'Earth',
    nm: 'Water',
    ty: 'Water'
  };
  return sectElementMap[sectId] || 'Metal';
}

export interface ElementalMultiplierResult {
  mult: number;
  text: string;
  color: string;
}

export function getElementalMultipliers(
  attackerElement: 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth',
  defenderElement?: 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth'
): ElementalMultiplierResult {
  if (!defenderElement) return { mult: 1.0, text: '', color: '' };
  
  const elementCounter: Record<'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth', 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth'> = {
    Metal: 'Wood',
    Wood: 'Earth',
    Earth: 'Water',
    Water: 'Fire',
    Fire: 'Metal'
  };

  const nameMap = { Metal: 'Kim', Wood: 'Mộc', Water: 'Thủy', Fire: 'Hỏa', Earth: 'Thổ' };

  if (elementCounter[attackerElement] === defenderElement) {
    return { mult: 1.5, text: `Khắc chế (${nameMap[attackerElement]} ➔ ${nameMap[defenderElement]})`, color: '#f1c40f' };
  } else if (elementCounter[defenderElement] === attackerElement) {
    return { mult: 0.7, text: `Bị khắc (${nameMap[attackerElement]} ⇠ ${nameMap[defenderElement]})`, color: '#7f8c8d' };
  }
  return { mult: 1.0, text: '', color: '' };
}
