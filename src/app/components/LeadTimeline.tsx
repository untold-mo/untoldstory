import React from 'react';
import { useData, Lead, Activity, type LeadStatus } from '../context/DataContext';
import { Clock, User as UserIcon, MessageSquare, ChevronRight, X, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LeadTimeline: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  return (
    <div className="relative border-r-2 border-slate-700/50 pr-6 space-y-6">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative">
          {/* Dot */}
          <div className="absolute -right-[33px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          
          <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl hover:bg-slate-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-emerald-500" />
                {activity.action}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ar })}
              </span>
            </div>
            
            {activity.note && (
              <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg mb-3 border-r-2 border-slate-600">
                "{activity.note}"
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-slate-300" />
              </div>
              <span className="text-[10px] text-slate-500">تم بواسطة {activity.userName}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const LeadDetailModal: React.FC<{ lead: Lead; isOpen: boolean; onClose: () => void }> = ({ lead, isOpen, onClose }) => {
  const { updateLeadStatus, users, assignLead } = useData();
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = lead.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const statuses: LeadStatus[] = ['جديد', 'قيد التواصل', 'عرض سعر', 'تفاوض', 'مغلق - فوز', 'مغلق - خسارة'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col scale-in-center">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-900 bg-slate-900/20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
              <span className="text-2xl font-black text-emerald-400">{lead.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-tight">{lead.name}</h2>
              <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">{lead.company}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>{lead.phone}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">الميزانية</p>
              <p className="text-lg font-black text-emerald-400">{lead.budget.toLocaleString()} ج.م</p>
            </div>
            <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">المصدر</p>
              <p className="text-lg font-black text-slate-200">{lead.source}</p>
            </div>
            <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-800 flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">حجم الشركة</p>
              <p className="text-lg font-black text-indigo-400">{lead.companySize}</p>
            </div>
            <div className="bg-slate-900/50 p-5 rounded-3xl border border-slate-800">
              <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">جودة الليد</p>
              <div className="flex items-center gap-3">
                 <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
                   <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full" style={{ width: `${lead.score}%` }} />
                 </div>
                 <span className="text-xs font-black text-emerald-400">{lead.score}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline Column */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-sm font-black text-slate-200 flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                سجل النشاط الزمني (Timeline)
              </h3>
              <LeadTimeline activities={lead.timeline} />
            </div>

            {/* Actions Column */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">تحديث الحالة</h3>
                <div className="grid grid-cols-1 gap-2">
                  {statuses.map(s => (
                    <button 
                      key={s}
                      onClick={() => updateLeadStatus(lead.id, s)}
                      className={cn(
                        "text-right px-4 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95",
                        lead.status === s 
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/5" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">تعيين مندوب</h3>
                <div className="space-y-2">
                  {users.filter(u => u.role === 'مندوب').map(user => (
                    <button 
                      key={user.id}
                      onClick={() => assignLead(lead.id, user.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-2xl border transition-all active:scale-95",
                        lead.assignedTo === user.id 
                          ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                      )}
                    >
                      <img src={user.avatar} className="w-8 h-8 rounded-xl border border-slate-700" alt="" />
                      <span className="text-xs font-bold">{user.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-900 bg-slate-900/20 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
             <Clock className="w-4 h-4 text-slate-500" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">آخر تحديث: {new Date(lead.updatedAt).toLocaleString('ar-EG')}</span>
           </div>
           <div className="flex gap-3 w-full sm:w-auto">
             <button 
               onClick={handleWhatsApp}
               className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
             >
               <Phone className="w-4 h-4" />
               تواصل واتساب
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
