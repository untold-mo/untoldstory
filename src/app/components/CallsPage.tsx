import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Calendar,
  Clock,
  Download,
  MoreVertical,
  User,
  Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useData } from '../context/DataContext';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type CallRow = {
  id: string;
  name: string;
  type: 'outgoing' | 'incoming' | 'missed';
  duration: string;
  time: string;
  date: string;
  status: 'completed' | 'missed';
  rating: number | null;
};

export default function CallsPage() {
  const { leads } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const callRows = useMemo(() => {
    const rows: CallRow[] = [];
    for (const lead of leads) {
      for (const act of lead.timeline || []) {
        const isCall = act.channelType === 'call' || (typeof act.durationSeconds === 'number' && act.durationSeconds > 0);
        if (!isCall) continue;
        const d = new Date(act.createdAt);
        const missed = act.qaStatus === 'rejected';
        rows.push({
          id: act.id,
          name: lead.name,
          type: missed ? 'missed' : 'outgoing',
          duration: typeof act.durationSeconds === 'number' && act.durationSeconds > 0 ? formatDuration(act.durationSeconds) : '—',
          time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
          status: missed ? 'missed' : 'completed',
          rating: null,
        });
      }
    }
    return rows.sort((a, b) => b.id.localeCompare(a.id));
  }, [leads]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return callRows;
    return callRows.filter((c) => c.name.toLowerCase().includes(q));
  }, [callRows, searchTerm]);

  const stats = useMemo(() => {
    const total = callRows.length;
    const missed = callRows.filter((c) => c.type === 'missed').length;
    const withDur = callRows.filter((c) => /^\d{2}:\d{2}$/.test(c.duration));
    const avgSec =
      withDur.length > 0
        ? Math.round(
            withDur.reduce((s, c) => {
              const [m, sec] = c.duration.split(':').map(Number);
              return s + m * 60 + sec;
            }, 0) / withDur.length,
          )
        : 0;
    return { total, missed, avg: avgSec > 0 ? formatDuration(avgSec) : '—' };
  }, [callRows]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">سجل المكالمات</h2>
          <p className="text-zinc-400">أنشطة اتصال من جداول زمنية لليدز (قناة مكالمة أو مدة مسجّلة)</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="flex items-center justify-center gap-2 bg-[#18181B] border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all">
            <Calendar className="h-4 w-4" />
            <span>عرض مباشر</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20">
            <Plus className="h-4 w-4" />
            <span>تسجيل يدوي</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CallStatCard label="أنشطة مكالمة" value={String(stats.total)} icon={PhoneCall} color="text-[#6366F1]" bgColor="bg-[#6366F1]/10" />
        <CallStatCard label="متوسط المدة (حيث وُجدت)" value={stats.avg} icon={Clock} color="text-[#10B981]" bgColor="bg-[#10B981]/10" />
        <CallStatCard label="مرفوض / فائت" value={String(stats.missed)} icon={PhoneMissed} color="text-[#EF4444]" bgColor="bg-[#EF4444]/10" />
      </div>

      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="البحث باسم الليد..."
              className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-800">
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">التاريخ والوقت</th>
                <th className="px-6 py-4">المدة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    لا توجد أنشطة مكالمات في الجداول الزمنية لليدز.
                  </td>
                </tr>
              ) : (
                filtered.map((call) => (
                  <tr key={call.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-white">{call.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {call.type === 'outgoing' ? (
                          <PhoneOutgoing className="h-3.5 w-3.5 text-blue-500" />
                        ) : call.type === 'incoming' ? (
                          <PhoneIncoming className="h-3.5 w-3.5 text-[#10B981]" />
                        ) : (
                          <PhoneMissed className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className="text-xs text-zinc-400">
                          {call.type === 'outgoing' ? 'صادرة' : call.type === 'incoming' ? 'واردة' : 'مرفوض/فائت'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs text-white font-medium">{call.date}</p>
                        <p className="text-[10px] text-zinc-500 font-bold">{call.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 font-mono">{call.duration}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{call.status === 'completed' ? 'مسجّل' : 'مرفوض'}</td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <button type="button" className="p-2 text-zinc-500 hover:text-[#6366F1] transition-all">
                          <Download className="h-4 w-4" />
                        </button>
                        <button type="button" className="p-2 text-zinc-500 hover:text-white transition-all">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CallStatCard({ label, value, icon: Icon, color, bgColor }: { label: string; value: string; icon: LucideIcon; color: string; bgColor: string }) {
  return (
    <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-2xl shadow-xl flex items-center gap-5">
      <div className={`h-12 w-12 ${bgColor} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <h4 className="text-xl font-bold text-white">{value}</h4>
      </div>
    </div>
  );
}
