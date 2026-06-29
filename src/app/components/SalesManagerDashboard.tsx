import {
  Users,
  Target,
  Timer,
  AlertCircle,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  Filter,
  MoreVertical,
  ArrowRight,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { useMemo } from "react";
import { motion as Motion } from "motion/react";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router";

export default function SalesManagerDashboard() {
  const { leads, users } = useData();
  const navigate = useNavigate();

  const teamUpdates = useMemo(() => {
    const repIds = new Set(users.filter((u) => u.role === 'مندوب').map((u) => u.id));
    const entries: { leadId: string; leadName: string; company: string; repName: string; action: string; note?: string; createdAt: string }[] = [];
    for (const lead of leads) {
      if (!lead.assignedTo || !repIds.has(lead.assignedTo)) continue;
      const rep = users.find((u) => u.id === lead.assignedTo);
      if (!rep) continue;
      for (const ev of (lead.timeline || [])) {
        entries.push({
          leadId: lead.id,
          leadName: lead.name,
          company: lead.company,
          repName: rep.name,
          action: ev.action,
          note: ev.note,
          createdAt: ev.createdAt,
        });
      }
    }
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return entries.slice(0, 15);
  }, [leads, users]);

  const unassignedLeads = leads.filter(l => !l.assignedTo);
  
  const getStageCount = (status: string) => {
    return leads.filter(l => l.status.toLowerCase() === status.toLowerCase()).length;
  };

  const salesReps = users.filter((t) => t.role === 'مندوب');

  const teamStatus = salesReps.map(rep => {
    const activeLeads = leads.filter(
      (l) => l.assignedTo === rep.id && (l.status === 'جديد' || l.status === 'قيد التواصل')
    ).length;
    return {
      id: rep.id,
      name: rep.name,
      status: Math.random() > 0.3 ? 'online' : 'offline',
      activeLeads,
      lastCall: "منذ 10 دقائق",
      avatar: rep.name[0],
      alert: activeLeads > 5
    };
  });

  const kanbanData = [
    { title: "جديد", status: "New", color: "bg-[#6366F1]" },
    { title: "تم التواصل", status: "Contacted", color: "bg-[#F59E0B]" },
    { title: "مؤهل", status: "Qualified", color: "bg-[#10B981]" },
    { title: "عرض سعر", status: "Proposal", color: "bg-[#8B5CF6]" },
    { title: "خسر", status: "Lost", color: "bg-[#EF4444]" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">إدارة المبيعات</h2>
          <p className="text-zinc-400">متابعة الفريق وتوزيع الليدز في الوقت الفعلي</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate("/sales-manager/leads")}
            className="flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20"
          >
            <Target className="h-5 w-5" />
            <span>عرض جميع الليدز</span>
          </button>
        </div>
      </div>

      {/* Team Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamStatus.map((member) => (
          <Motion.div 
            key={member.id}
            whileHover={{ y: -4 }}
            className={`bg-[#18181B] border ${member.alert ? 'border-red-500/50 shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]' : 'border-zinc-800'} p-5 rounded-2xl shadow-xl transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-zinc-700 flex items-center justify-center text-lg font-bold text-white">
                  {member.avatar}
                </div>
                <span className={`absolute -bottom-1 -right-1 block h-3.5 w-3.5 rounded-full border-2 border-[#18181B] ${member.status === 'online' ? 'bg-[#10B981]' : 'bg-zinc-500'}`}></span>
              </div>
              <div className="text-left">
                <p className="text-xs text-zinc-500 font-medium">{member.status === 'online' ? 'متصل' : 'غير متصل'}</p>
                {member.alert && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                    <AlertCircle className="h-3 w-3" /> تنبيه
                  </span>
                )}
              </div>
            </div>
            <h4 className="text-base font-bold text-white mb-3">{member.name}</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> ليدز نشطة</span>
                <span className="font-bold text-white">{member.activeLeads}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> آخر مكالمة</span>
                <span className="font-bold text-white">{member.lastCall}</span>
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Team Timeline Updates */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#10B981]" /> آخر تحديثات الفريق
          </h3>
          <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{teamUpdates.length}</span>
        </div>
        <div className="max-h-[320px] overflow-y-auto divide-y divide-zinc-800">
          {teamUpdates.length > 0 ? teamUpdates.map((ev, i) => {
            const timeAgo = (() => {
              const diff = Date.now() - new Date(ev.createdAt).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return 'الآن';
              if (mins < 60) return `منذ ${mins} د`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `منذ ${hrs} س`;
              return `منذ ${Math.floor(hrs / 24)} يوم`;
            })();
            return (
              <div key={`${ev.leadId}-${i}`} className="px-6 py-3 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#6366F1]/20 text-[#6366F1] flex items-center justify-center text-[10px] font-bold shrink-0">
                      {ev.repName[0]}
                    </span>
                    <span className="text-xs font-bold text-white">{ev.repName}</span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500">{ev.company}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo}</span>
                </div>
                <p className="text-xs text-zinc-400 mr-8">{ev.action}</p>
                {ev.note && <p className="text-[11px] text-zinc-500 mr-8 mt-0.5 line-clamp-1">{ev.note}</p>}
              </div>
            );
          }) : (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500">لا توجد تحديثات حتى الآن</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incoming Leads Feed */}
        <div className="lg:col-span-1 bg-[#18181B] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[500px]">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Timer className="h-5 w-5 text-[#6366F1]" /> ليدز قادمة (غير موزعة)
            </h3>
            <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unassignedLeads.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {unassignedLeads.length > 0 ? unassignedLeads.map((lead) => (
              <div key={lead.id} className="p-4 rounded-xl bg-[#09090B] border border-zinc-800 hover:border-[#6366F1]/50 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-400`}>
                    {lead.source}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">الآن</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{lead.company}</h4>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-3">
                   <span>{lead.name}</span>
                   <span className="h-1 w-1 rounded-full bg-zinc-700"></span>
                   <span>{lead.budget.toLocaleString()} ج.م</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#10B981]" style={{ width: `70%` }}></div>
                   </div>
                   <button 
                    onClick={() => navigate("/sales-manager/leads")}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#6366F1] hover:underline"
                   >
                     توزيع <ArrowRight className="h-3 w-3" />
                   </button>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <CheckCircle2 className="h-10 w-10 text-[#10B981] mb-2 opacity-50" />
                <p className="text-sm font-bold text-white">لا يوجد ليدز جديدة</p>
                <p className="text-xs text-zinc-500">تم توزيع كافة الليدز بنجاح</p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="lg:col-span-2 bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">مراحل البيع (Pipeline)</h3>
            <div className="flex gap-2">
               <button className="p-2 rounded-lg bg-[#09090B] border border-zinc-800 text-zinc-400 hover:text-white transition-all">
                 <MoreVertical className="h-5 w-5" />
               </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
            {kanbanData.map((stage) => (
              <div key={stage.title} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-bold text-white">{stage.title}</span>
                  <span className="text-xs font-medium text-zinc-500">{getStageCount(stage.status)}</span>
                </div>
                <div className={`h-2 w-full rounded-full ${stage.color}/10 overflow-hidden`}>
                  <Motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${stage.color}`}
                  ></Motion.div>
                </div>
                <div className="flex-1 bg-[#09090B] border border-dashed border-zinc-800 rounded-xl p-3 flex flex-col gap-2 overflow-y-auto">
                   {leads.filter(l => l.status.toLowerCase() === stage.status.toLowerCase()).slice(0, 3).map(lead => (
                     <div key={lead.id} className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                        <p className="text-[10px] font-bold text-white truncate">{lead.company}</p>
                        <p className="text-[8px] text-zinc-500 truncate">{lead.name}</p>
                     </div>
                   ))}
                   {getStageCount(stage.status) > 3 && (
                     <p className="text-[8px] text-zinc-500 text-center">+{getStageCount(stage.status) - 3} آخرين</p>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
