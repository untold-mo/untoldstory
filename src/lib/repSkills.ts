import type { LeadCategory } from '@/app/context/DataContext';

export const REP_SKILL_PRESETS: LeadCategory[] = [
  'إنجليزي',
  'شركات كبرى',
  'شركات صغيرة',
  'إعلانات',
  'سوشيال ميديا',
];

export function normalizeRepSkillLabel(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

/** هل مهارات المندوب تغطي تصنيف الليد (تطابق حرفي أو جزئي) */
export function repSkillMatchesLeadCategory(skills: string[], category: LeadCategory): boolean {
  if (!skills.length) return false;
  if (skills.includes(category)) return true;
  const cat = category.trim();
  return skills.some((s) => {
    const skill = s.trim();
    if (!skill) return false;
    return skill === cat || skill.includes(cat) || cat.includes(skill);
  });
}

export function splitRepSkills(skills: string[] = []) {
  const presetSet = new Set<string>(REP_SKILL_PRESETS);
  const customSkills = skills.filter((s) => s && !presetSet.has(s));
  return { customSkills };
}
