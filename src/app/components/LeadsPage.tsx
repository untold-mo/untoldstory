import {
  Target,
  Search,
  Plus,
  Phone,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  X,
  ArrowRight,
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useData, Lead, LeadStatus, DeleteLeadResult } from '../context/DataContext';
import * as Dialog from '@radix-ui/react-dialog';

const STATUS_FILTERS: Array<'all' | LeadStatus> = [
  'all',
  'جديد',
  'قيد التواصل',
  'عرض سعر',
  'تفاوض',
  'مغلق - فوز',
  'مغلق - خسارة',
];

function getStatusStyle(status: string) {
  switch (status) {
    case 'جديد':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'قيد التواصل':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'عرض سعر':
    case 'تفاوض':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'مغلق - فوز':
      return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
    case 'مغلق - خسارة':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
}

function getStatusLabel(status: string) {
  return status;
}

export default function LeadsPage({ isSalesRep = false }: { isSalesRep?: boolean }) {
  const { leads, users, currentUser, addLead, assignLead, deleteLead } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const currentUserId = currentUser?.id ?? '';

  const displayLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || lead.status === activeFilter;
    const matchesRole = !isSalesRep || lead.assignedTo === currentUserId;
    return matchesSearch && matchesFilter && matchesRole;
  });

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!(currentUser?.role === 'مالك' || currentUser?.role === 'مدير مبيعات')) {
      toast.error('يتطلب إضافة ليد صلاحية المالك أو مدير المبيعات — سجّل من النظام الرئيسي');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const budget = Number(formData.get('value')) || 0;
    addLead({
      name: String(formData.get('name') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      source: String(formData.get('source') || 'يدوي'),
      status: 'جديد',
      budget,
      companySize: 'متوسط',
      category: 'سوشيال ميديا',
    });
    setIsAddModalOpen(false);
    toast.success('تم إرسال طلب إضافة الليد');
  };

  const handleAssign = (userId: string) => {
    if (!selectedLead) return;
    if (!(currentUser?.role === 'مالك' || currentUser?.role === 'مدير مبيعات')) {
      toast.error('صلاحية التعيين للمالك أو مدير المبيعات فقط');
      return;
    }
    assignLead(selectedLead.id, userId);
    setIsAssignModalOpen(false);
    setSelectedLead(null);
    toast.success('تم تعيين الليد للموظف');
  };

  const salesReps = users.filter((u) => u.role === 'مندوب');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{isSalesRep ? 'الليدز الخاصة بي' : 'إدارة جميع الليدز'}</h2>
          <p className="text-zinc-400">متابعة العملاء المحتملين وتحديث حالات التواصل</p>
        </div>
        <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center justify-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20">
              <Plus className="h-5 w-5" />
              <span>إضافة ليد جديد</span>
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#18181B] border border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95 duration-200 focus:outline-none">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-bold text-white">إضافة ليد جديد</Dialog.Title>
                <Dialog.Description className="sr-only">استخدم هذا النموذج لإضافة عميل محتمل جديد إلى النظام.</Dialog.Description>
                <Dialog.Close className="text-zinc-500 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">الاسم بالكامل</label>
                    <input name="name" required className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-4 text-sm text-white focus:ring-2 focus:ring-[#6366F1]/50 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">الشركة</label>
                    <input name="company" required className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-4 text-sm text-white focus:ring-2 focus:ring-[#6366F1]/50 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">رقم الهاتف</label>
                    <input name="phone" required className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-4 text-sm text-white focus:ring-2 focus:ring-[#6366F1]/50 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">البريد الإلكتروني</label>
                    <input name="email" type="email" required className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-4 text-sm text-white focus:ring-2 focus:ring-[#6366F1]/50 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">المصدر</label>
                    <select name="source" className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-4 text-sm text-white focus:ring-2 focus:ring-[#6366F1]/50 outline-none transition-all">
                      <option value="فيسبوك">فيسبوك</option>
                      <option value="إنستجرام">إنستجرام</option>
                      <option value="الموقع">الموقع الإلكتروني</option>
                      <option value="يدوي">إضافة يدوية</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">الميزانية المتوقعة (ج.م)</label>
                    <input name="value" type="number" defaultValue="0" className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-4 text-sm text-white focus:ring-2 focus:ring-[#6366F1]/50 outline-none transition-all" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#6366F1] text-white py-2.5 rounded-xl font-bold hover:bg-[#5254E2] transition-all shadow-lg shadow-[#6366F1]/20">
                    حفظ البيانات
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <LeadStatCard title="إجمالي الليدز" value={leads.length.toString()} trend="+3" icon={Target} color="text-blue-500" />
        <LeadStatCard
          title="جديد"
          value={leads.filter((l) => l.status === 'جديد').length.toString()}
          trend="-2"
          icon={Clock}
          color="text-yellow-500"
        />
        <LeadStatCard
          title="مغلق (فوز)"
          value={leads.filter((l) => l.status === 'مغلق - فوز').length.toString()}
          trend="+1"
          icon={CheckCircle2}
          color="text-[#10B981]"
        />
        <LeadStatCard
          title="إجمالي الميزانيات"
          value={leads.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0).toLocaleString()}
          trend="+2%"
          icon={TrendingUp}
          color="text-purple-500"
        />
      </div>

      <div className="bg-[#18181B] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="البحث عن ليد أو شركة..."
              className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                  activeFilter === filter ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-[#09090B] text-zinc-500 border-zinc-800 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'الكل' : getStatusLabel(filter)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-800">
                <th className="px-6 py-4">العميل والشركة</th>
                <th className="px-6 py-4">المصدر</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الميزانية</th>
                {!isSalesRep && <th className="px-6 py-4">المسؤول</th>}
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {displayLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-sm font-bold text-white group-hover:bg-[#6366F1] transition-all">
                        {(lead.name && lead.name[0]) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{lead.name}</p>
                        <p className="text-xs text-zinc-500">{lead.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[14rem]">
                    <span
                      title={lead.source}
                      className="text-[10px] leading-snug bg-zinc-800 text-zinc-200 px-2 py-1 rounded-lg font-bold line-clamp-2 block whitespace-normal"
                    >
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${getStatusStyle(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-300">{(Number(lead.budget) || 0).toLocaleString()} ج.م</td>
                  {!isSalesRep && (
                    <td className="px-6 py-4">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center text-[10px] font-bold text-[#6366F1]">
                            {(users.find((t) => t.id === lead.assignedTo)?.name || '?')[0]}
                          </div>
                          <span className="text-xs text-zinc-400">{users.find((t) => t.id === lead.assignedTo)?.name || '—'}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsAssignModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#6366F1] hover:underline"
                        >
                          <UserPlus className="h-3 w-3" />
                          تعيين مسؤول
                        </button>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-xs text-zinc-500">{new Date(lead.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toast.success(`جاري الاتصال بـ ${lead.name}`)} className="p-2 text-zinc-500 hover:text-[#10B981] transition-all">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!(currentUser?.role === 'مالك' || currentUser?.role === 'مدير مبيعات')) {
                            toast.error('حذف الليد للمالك أو مدير المبيعات فقط');
                            return;
                          }
                          if (!window.confirm(`حذف الليد «${lead.name}» نهائياً؟`)) return;
                          const r: DeleteLeadResult = await deleteLead(lead.id);
                          if (r === 'deleted') toast.success('تم حذف الليد');
                          else if (r === 'blocked') toast.error('لا يمكن الحذف: توجد فواتير أو عروض أسعار مرتبطة بهذا الليد');
                          else if (r === 'forbidden') toast.error('ليست لديك صلاحية حذف الليد');
                          else toast.error('تعذر حذف الليد');
                        }}
                        className="p-2 text-zinc-500 hover:text-red-500 transition-all"
                        title="حذف الليد"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayLeads.length === 0 && (
            <div className="py-20 text-center">
              <div className="h-20 w-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">لا يوجد نتائج</h3>
              <p className="text-zinc-500 text-sm">جرب البحث بكلمات مختلفة أو تغيير التصفية</p>
            </div>
          )}
        </div>
      </div>

      <Dialog.Root open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#18181B] border border-zinc-800 rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95 duration-200 focus:outline-none">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-white">تعيين مسؤول مبيعات</Dialog.Title>
              <Dialog.Description className="sr-only">اختر موظفاً من فريق المبيعات لتعيينه مسؤولاً عن هذا الليد.</Dialog.Description>
              <Dialog.Close className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="space-y-3">
              {salesReps.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => handleAssign(rep.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#09090B] border border-zinc-800 hover:border-[#6366F1] hover:bg-[#6366F1]/5 transition-all group text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white group-hover:bg-[#6366F1]">
                      {rep.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{rep.name}</p>
                      <p className="text-[10px] text-zinc-500">مندوب مبيعات</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-[#6366F1]" />
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function LeadStatCard({ title, value, trend, icon: Icon, color }: any) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-[#18181B] border border-zinc-800 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
            isPositive ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-500'
          }`}
        >
          {trend}
        </span>
      </div>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-white">{value}</h4>
    </div>
  );
}
