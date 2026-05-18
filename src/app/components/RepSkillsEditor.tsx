import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { LeadCategory, User } from '../context/DataContext';
import { normalizeRepSkillLabel, REP_SKILL_PRESETS, splitRepSkills } from '@/lib/repSkills';

type Props = {
  rep: User;
  canEdit: boolean;
  updateUserSkills: (userId: string, skills: string[]) => Promise<boolean>;
  presets?: LeadCategory[];
};

export function RepSkillsEditor({
  rep,
  canEdit,
  updateUserSkills,
  presets = REP_SKILL_PRESETS,
}: Props) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const skills = rep.skills || [];
  const { customSkills } = splitRepSkills(skills);

  const persistSkills = async (next: string[]) => {
    const unique = [...new Set(next.map(normalizeRepSkillLabel).filter(Boolean))];
    setSaving(true);
    try {
      const ok = await updateUserSkills(rep.id, unique);
      if (!ok) {
        toast.error('تعذر حفظ المهارات على السيرفر');
        return false;
      }
      toast.success('تم تحديث مهارات المندوب');
      return true;
    } finally {
      setSaving(false);
    }
  };

  const togglePreset = (skill: LeadCategory) => {
    if (!canEdit || saving) return;
    const next = skills.includes(skill) ? skills.filter((s) => s !== skill) : [...skills, skill];
    void persistSkills(next);
  };

  const removeSkill = (skill: string) => {
    if (!canEdit || saving) return;
    void persistSkills(skills.filter((s) => s !== skill));
  };

  const addCustomSkill = () => {
    if (!canEdit || saving) return;
    const label = normalizeRepSkillLabel(draft);
    if (!label) {
      toast.error('اكتب اسم المهارة أولاً');
      return;
    }
    if (skills.includes(label)) {
      toast.info('المهارة موجودة مسبقاً لهذا المندوب');
      setDraft('');
      return;
    }
    void (async () => {
      const ok = await persistSkills([...skills, label]);
      if (ok) setDraft('');
    })();
  };

  return (
    <div className="space-y-3" dir="rtl">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">التخصصات والمهارات:</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((skill) => {
          const isSelected = skills.includes(skill);
          return (
            <button
              key={`${rep.id}-preset-${skill}`}
              type="button"
              disabled={!canEdit || saving}
              onClick={() => togglePreset(skill)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {skill}
            </button>
          );
        })}
        {customSkills.map((skill) => (
          <span
            key={`${rep.id}-custom-${skill}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-violet-500/25 text-violet-100 border border-violet-400/35"
          >
            {skill}
            {canEdit && (
              <button
                type="button"
                disabled={saving}
                onClick={() => removeSkill(skill)}
                className="p-0.5 rounded-md hover:bg-violet-500/30 disabled:opacity-50"
                aria-label={`حذف ${skill}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        ))}
      </div>
      {canEdit && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCustomSkill();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            placeholder="مهارة جديدة (مثال: سيارات فاخرة، EQ…)"
            className="flex-1 min-w-[180px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-400/50"
          />
          <button
            type="submit"
            disabled={saving || !draft.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            إضافة مهارة
          </button>
        </form>
      )}
    </div>
  );
}
