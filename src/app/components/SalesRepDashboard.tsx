import { 
  Timer, 
  Phone, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Zap,
  PhoneCall,
  Target,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useData } from "../context/DataContext";

export default function SalesRepDashboard() {
  const navigate = useNavigate();
  const { leads, updateLeadStatus, currentUser } = useData();
  const [online, setOnline] = useState(true);
  
  const currentRepId = currentUser?.id ?? '';
  const myLeads = leads.filter((l) => l.assignedTo === currentRepId);

  const handleCall = (leadId: string, name: string) => {
    toast.success(`جاري الاتصال بـ ${name}...`);
    updateLeadStatus(leadId, 'قيد التواصل');
    setTimeout(() => {
       navigate("/sales-rep/calls");
    }, 2000);
  };

  const getStatusLabel = (status: string) => status;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#18181B] border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
           <div className={`h-3 w-3 rounded-full ${online ? 'bg-[#10B981] animate-pulse' : 'bg-red-500'}`}></div>
           <span className="text-lg font-bold text-white">{online ? 'أنا متصل' : 'أنا غير متصل'}</span>
           <button 
            onClick={() => setOnline(!online)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              online ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
            }`}
           >
            {online ? 'إيقاف استقبال الليدز' : 'تفعيل الاستقبال'}
           </button>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-center">
             <span className="text-zinc-500 font-medium">الترتيب</span>
             <span className="text-[#F59E0B] font-bold text-lg">#2</span>
          </div>
          <div className="h-10 w-[1px] bg-zinc-800 hidden md:block"></div>
          <div className="flex flex-col items-center">
             <span className="text-zinc-500 font-medium">نقاطي اليوم</span>
             <span className="text-[#6366F1] font-bold text-lg">450</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-[#6366F1]" /> الليدز الحالية
            </h3>
            <span className="text-xs text-zinc-500 font-medium">إجمالي: {myLeads.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {myLeads.length > 0 ? (
                myLeads.map((lead) => (
                  <Motion.div 
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400`}>
                        <Timer className="h-3.5 w-3.5" />
                        <span>منذ {Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / 60000)} دقيقة</span>
                      </div>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg uppercase">{lead.source}</span>
                    </div>

                    <h4 className="text-lg font-bold text-white mb-1">{lead.name}</h4>
                    <p className="text-sm text-zinc-500 font-medium mb-4">{lead.company}</p>

                    <div className="flex items-center gap-3 mb-6">
                       <span className="text-[11px] bg-[#6366F1]/10 text-[#6366F1] px-2 py-0.5 rounded-full font-bold">{getStatusLabel(lead.status)}</span>
                       <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">{lead.budget.toLocaleString()} ج.م</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => handleCall(lead.id, lead.name)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#6366F1] text-white hover:bg-[#5254E2] transition-all"
                      >
                        <Phone className="h-5 w-5" />
                        <span className="text-[10px] font-bold">اتصال</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-all border border-[#10B981]/20">
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-[10px] font-bold">واتساب</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-zinc-700">
                        <FileText className="h-5 w-5" />
                        <span className="text-[10px] font-bold">ملاحظة</span>
                      </button>
                    </div>
                  </Motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-[#18181B] border border-dashed border-zinc-800 rounded-2xl">
                  <div className="h-16 w-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">لا يوجد ليدز حالياً</h4>
                  <p className="text-zinc-500 text-sm">سيتم عرض الليدز المعينة لك هنا</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F59E0B]" /> إحصائيات اليوم
              </h3>
              <div className="space-y-4">
                <StatRow label="الليدز المستلمة" value={myLeads.length.toString()} icon={Target} color="text-[#6366F1]" />
                <StatRow label="مكالمات مكتملة" value={myLeads.filter((l) => l.status === 'قيد التواصل').length.toString()} icon={PhoneCall} color="text-[#10B981]" />
                <StatRow label="عملاء مهتمين" value={myLeads.filter((l) => l.status === 'تفاوض').length.toString()} icon={CheckCircle2} color="text-[#F59E0B]" />
                <StatRow label="متوسط وقت الرد" value="4:20 د" icon={Clock} color="text-zinc-400" />
              </div>
           </div>

           <div className="bg-gradient-to-br from-[#18181B] to-[#111111] border border-[#6366F1]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#6366F1]"></div>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-white">نظام النقاط</h3>
                 <Award className="h-6 w-6 text-[#F59E0B]" />
              </div>
              <p className="text-zinc-500 text-sm mb-6">تبقّى لك 150 نقطة للحصول على شارة "نجم الأسبوع"</p>
              <div className="space-y-4">
                 <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6366F1]" style={{ width: '75%' }}></div>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-[#6366F1]">450 نقطة</span>
                    <span className="text-zinc-500">600 نقطة</span>
                 </div>
              </div>
              <button className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-all">
                 عرض قائمة المتصدرين <ExternalLink className="h-4 w-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon: Icon, color }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#09090B] border border-zinc-800">
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-medium text-zinc-400">{label}</span>
      </div>
      <span className="text-base font-bold text-white">{value}</span>
    </div>
  );
}
