import { EventCategory } from '../types/index.js';

export interface CategoryTheme {
  name: string;
  hex: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  imageTagBg: string;
  dotColor: string;
  mapPinColor: string;
  cardBorderAccent: string;
  badgeBg: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Workshops: {
    name: 'Workshops',
    hex: '#9A4318',
    pillBg: 'bg-[#9A4318]/15',
    pillText: 'text-[#80310E]',
    pillBorder: 'border-[#9A4318]/35',
    imageTagBg: 'bg-[#9A4318]',
    dotColor: '#9A4318',
    mapPinColor: '#9A4318',
    cardBorderAccent: 'border-l-4 border-l-[#9A4318]',
    badgeBg: 'bg-[#9A4318]',
  },
  Hackathons: {
    name: 'Hackathons',
    hex: '#6B1E23',
    pillBg: 'bg-[#6B1E23]/15',
    pillText: 'text-[#6B1E23]',
    pillBorder: 'border-[#6B1E23]/35',
    imageTagBg: 'bg-[#6B1E23]',
    dotColor: '#6B1E23',
    mapPinColor: '#6B1E23',
    cardBorderAccent: 'border-l-4 border-l-[#6B1E23]',
    badgeBg: 'bg-[#6B1E23]',
  },
  'Career Events': {
    name: 'Career Events',
    hex: '#1B4D3E',
    pillBg: 'bg-[#1B4D3E]/15',
    pillText: 'text-[#12382C]',
    pillBorder: 'border-[#1B4D3E]/35',
    imageTagBg: 'bg-[#1B4D3E]',
    dotColor: '#1B4D3E',
    mapPinColor: '#1B4D3E',
    cardBorderAccent: 'border-l-4 border-l-[#1B4D3E]',
    badgeBg: 'bg-[#1B4D3E]',
  },
  Networking: {
    name: 'Networking',
    hex: '#B45309',
    pillBg: 'bg-[#B45309]/15',
    pillText: 'text-[#8A3E04]',
    pillBorder: 'border-[#B45309]/35',
    imageTagBg: 'bg-[#B45309]',
    dotColor: '#B45309',
    mapPinColor: '#B45309',
    cardBorderAccent: 'border-l-4 border-l-[#B45309]',
    badgeBg: 'bg-[#B45309]',
  },
  Cultural: {
    name: 'Cultural',
    hex: '#831843',
    pillBg: 'bg-[#831843]/15',
    pillText: 'text-[#701037]',
    pillBorder: 'border-[#831843]/35',
    imageTagBg: 'bg-[#831843]',
    dotColor: '#831843',
    mapPinColor: '#831843',
    cardBorderAccent: 'border-l-4 border-l-[#831843]',
    badgeBg: 'bg-[#831843]',
  },
  Competitions: {
    name: 'Competitions',
    hex: '#C2410C',
    pillBg: 'bg-[#C2410C]/15',
    pillText: 'text-[#9A3412]',
    pillBorder: 'border-[#C2410C]/35',
    imageTagBg: 'bg-[#C2410C]',
    dotColor: '#C2410C',
    mapPinColor: '#C2410C',
    cardBorderAccent: 'border-l-4 border-l-[#C2410C]',
    badgeBg: 'bg-[#C2410C]',
  },
};

export function getCategoryTheme(category: string): CategoryTheme {
  return (
    CATEGORY_THEMES[category] || {
      name: category || 'General',
      hex: '#6B1E23',
      pillBg: 'bg-[#6B1E23]/15',
      pillText: 'text-[#6B1E23]',
      pillBorder: 'border-[#6B1E23]/35',
      imageTagBg: 'bg-[#6B1E23]',
      dotColor: '#6B1E23',
      mapPinColor: '#6B1E23',
      cardBorderAccent: 'border-l-4 border-l-[#6B1E23]',
      badgeBg: 'bg-[#6B1E23]',
    }
  );
}
