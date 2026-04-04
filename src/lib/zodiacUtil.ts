export type ZodiacSign = 
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Element = 'fire' | 'earth' | 'air' | 'water';

interface ZodiacInfo {
  name: string;
  sign: ZodiacSign;
  symbol: string;
  emoji: string;
  element: Element;
  dateRange: string;
  personality: string;
}

export const ZODIAC_SIGNS: ZodiacInfo[] = [
  { name: 'Aries', sign: 'aries', symbol: '♈', emoji: '♈', element: 'fire', dateRange: 'Mar 21 – Apr 19', personality: 'Bold opener, fierce protector of their people' },
  { name: 'Taurus', sign: 'taurus', symbol: '♉', emoji: '♉', element: 'earth', dateRange: 'Apr 20 – May 20', personality: 'Slow-burn connection, loyalty runs deep' },
  { name: 'Gemini', sign: 'gemini', symbol: '♊', emoji: '♊', element: 'air', dateRange: 'May 21 – Jun 20', personality: 'Endless curiosity, every date is an adventure' },
  { name: 'Cancer', sign: 'cancer', symbol: '♋', emoji: '♋', element: 'water', dateRange: 'Jun 21 – Jul 22', personality: 'Creates a home in every relationship' },
  { name: 'Leo', sign: 'leo', symbol: '♌', emoji: '♌', element: 'fire', dateRange: 'Jul 23 – Aug 22', personality: 'Generous lover, wants everyone to shine' },
  { name: 'Virgo', sign: 'virgo', symbol: '♍', emoji: '♍', element: 'earth', dateRange: 'Aug 23 – Sep 22', personality: 'Thoughtful communicator, detail-oriented care' },
  { name: 'Libra', sign: 'libra', symbol: '♎', emoji: '♎', element: 'air', dateRange: 'Sep 23 – Oct 22', personality: 'Natural mediator, values harmony in all connections' },
  { name: 'Scorpio', sign: 'scorpio', symbol: '♏', emoji: '♏', element: 'water', dateRange: 'Oct 23 – Nov 21', personality: 'Intense depth, authenticity above all' },
  { name: 'Sagittarius', sign: 'sagittarius', symbol: '♐', emoji: '♐', element: 'fire', dateRange: 'Nov 22 – Dec 21', personality: 'Freedom-loving, philosophical connection seeker' },
  { name: 'Capricorn', sign: 'capricorn', symbol: '♑', emoji: '♑', element: 'earth', dateRange: 'Dec 22 – Jan 19', personality: 'Builds lasting structures, even in love' },
  { name: 'Aquarius', sign: 'aquarius', symbol: '♒', emoji: '♒', element: 'air', dateRange: 'Jan 20 – Feb 18', personality: 'Unconventional by nature, relationship anarchist energy' },
  { name: 'Pisces', sign: 'pisces', symbol: '♓', emoji: '♓', element: 'water', dateRange: 'Feb 19 – Mar 20', personality: 'Empathic connector, loves without boundaries' },
];

export function getElement(sign: ZodiacSign | null | undefined): Element | null {
  if (!sign) return null;
  const info = ZODIAC_SIGNS.find(z => z.sign === sign);
  return info?.element ?? null;
}

export function getElementColor(element: Element): string {
  switch (element) {
    case 'fire': return '#EF4444';
    case 'earth': return '#16A34A';
    case 'air': return '#06B6D4';
    case 'water': return '#8B5CF6';
  }
}

export function getElementEmoji(element: Element): string {
  switch (element) {
    case 'fire': return '🔥';
    case 'earth': return '🌍';
    case 'air': return '💨';
    case 'water': return '🌊';
  }
}

export function getZodiacEmoji(sign: ZodiacSign): string {
  return ZODIAC_SIGNS.find(z => z.sign === sign)?.symbol ?? '';
}

export function getDateRange(sign: ZodiacSign): string {
  return ZODIAC_SIGNS.find(z => z.sign === sign)?.dateRange ?? '';
}

export function getZodiacInfo(sign: ZodiacSign | null | undefined): ZodiacInfo | null {
  if (!sign) return null;
  return ZODIAC_SIGNS.find(z => z.sign === sign) ?? null;
}

function isComplementary(a: Element, b: Element): boolean {
  return (a === 'fire' && b === 'air') || (a === 'air' && b === 'fire') ||
         (a === 'earth' && b === 'water') || (a === 'water' && b === 'earth');
}

function isNeutral(a: Element, b: Element): boolean {
  return (a === 'fire' && b === 'earth') || (a === 'earth' && b === 'fire') ||
         (a === 'air' && b === 'water') || (a === 'water' && b === 'air');
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getElementCompatibility(signA: ZodiacSign | null, signB: ZodiacSign | null): number {
  const elA = getElement(signA);
  const elB = getElement(signB);
  if (!elA || !elB) return 50;
  if (elA === elB) return randomInRange(85, 95);
  if (isComplementary(elA, elB)) return randomInRange(75, 88);
  if (isNeutral(elA, elB)) return randomInRange(50, 65);
  return randomInRange(35, 50);
}

interface AstrologyData {
  sun_sign: ZodiacSign | null;
  moon_sign: ZodiacSign | null;
  rising_sign: ZodiacSign | null;
}

export function calculateCosmicCompatibility(userA: AstrologyData, userB: AstrologyData): {
  score: number;
  label: string;
  emoji: string;
  color: string;
  breakdown: { type: string; signA: string | null; signB: string | null; score: number }[];
} {
  let score = 0;
  let maxScore = 0;
  const breakdown: { type: string; signA: string | null; signB: string | null; score: number }[] = [];

  const sunScore = getElementCompatibility(userA.sun_sign, userB.sun_sign);
  score += sunScore * 0.4;
  maxScore += 100 * 0.4;
  breakdown.push({ type: 'Sun', signA: userA.sun_sign, signB: userB.sun_sign, score: sunScore });

  const moonScore = getElementCompatibility(userA.moon_sign, userB.moon_sign);
  score += moonScore * 0.35;
  maxScore += 100 * 0.35;
  breakdown.push({ type: 'Moon', signA: userA.moon_sign, signB: userB.moon_sign, score: moonScore });

  const risingScore = getElementCompatibility(userA.rising_sign, userB.rising_sign);
  score += risingScore * 0.25;
  maxScore += 100 * 0.25;
  breakdown.push({ type: 'Rising', signA: userA.rising_sign, signB: userB.rising_sign, score: risingScore });

  if (userA.sun_sign && userA.sun_sign === userB.sun_sign) score += 5;
  if (userA.moon_sign && userA.moon_sign === userB.moon_sign) score += 10;
  if (userA.rising_sign && userA.rising_sign === userB.rising_sign) score += 5;

  const finalScore = Math.min(Math.round((score / maxScore) * 100), 100);
  const { text: label, emoji, color } = getCompatibilityLabel(finalScore);

  return { score: finalScore, label, emoji, color, breakdown };
}

export function getCompatibilityLabel(score: number): { text: string; emoji: string; color: string } {
  if (score >= 85) return { text: 'Your stars align!', emoji: '✨', color: '#FFD700' };
  if (score >= 70) return { text: 'Strong cosmic connection', emoji: '🌟', color: '#7C3AED' };
  if (score >= 50) return { text: 'Opposites attract', emoji: '🌙', color: '#06B6D4' };
  return { text: 'Cosmic mystery', emoji: '🔮', color: '#EC4899' };
}
