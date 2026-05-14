import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useData, LeadStatus, User } from '../context/DataContext';
import { Trophy, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1. Sales Funnel Component
export const SalesFunnelChart: React.FC = () => {
  const { leads } = useData();
  
  const statusOrder: LeadStatus[] = ['جديد', 'قيد التواصل', 'عرض سعر', 'تفاوض', 'مغلق - فوز'];
  const funnelData = statusOrder.map(status => ({
    name: status,
    value: leads.filter(l => l.status === status).length
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-xs">
          <p className="font-bold">{payload[0].payload.name}</p>
          <p>العدد: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full p-4" style={{ minHeight: '300px' }}>
      <h3 className="text-slate-200 text-sm font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        مراحل المبيعات
      </h3>
      <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0}>
        <BarChart
          layout="vertical"
          data={funnelData}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          id="sales-funnel-chart-root"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            width={80}
            key="funnel-yaxis-v2"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={25} key="funnel-bar-main">
            {funnelData.map((entry, index) => (
              <Cell key={`funnel-cell-item-${index}-${entry.name}`} fill={`hsla(${160 - index * 20}, 70%, 50%, 0.8)`} />
            ))}
            <LabelList dataKey="value" position="right" fill="#cbd5e1" fontSize={12} key="funnel-label-list" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Leaderboard Component
export const Leaderboard: React.FC = () => {
  const { users } = useData();
  const sortedUsers = [...users].sort((a, b) => b.stats.points - a.stats.points);

  return (
    <div className="p-4">
      <h3 className="text-slate-200 text-sm font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        أبطال المبيعات
      </h3>
      <div className="space-y-3">
        {sortedUsers.slice(0, 4).map((user, index) => (
          <div key={`leaderboard-entry-${user.id}-${index}`} className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-xl" alt={user.name} />
                {index < 3 && (
                  <div key={`leader-medal-${index}-${user.id}`} className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-slate-900 font-bold",
                    index === 0 ? "bg-amber-500 text-amber-950" : index === 1 ? "bg-slate-300 text-slate-800" : "bg-orange-400 text-orange-950"
                  )}>
                    {index + 1}
                  </div>
                )}
              </div>
              <div>
                <p className="text-slate-100 text-sm font-medium">{user.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                    {user.stats.dealsWon} صفقة
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {user.stats.avgResponseTime}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-amber-400 text-xs font-bold">{user.stats.points.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">نقطة</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Lead Score Badge
export const LeadScore: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (score >= 50) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  return (
    <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold", getScoreColor())}>
      {score}% جودة
    </div>
  );
};

// 4. SLA Indicator
export const SLAStatus: React.FC<{ status: 'مستقر' | 'متأخر' | 'حرج' }> = ({ status }) => {
  const config = {
    'مستقر': { color: 'text-emerald-400 bg-emerald-400/10', icon: Clock, label: 'مستقر' },
    'متأخر': { color: 'text-amber-400 bg-amber-400/10', icon: AlertCircle, label: 'تنبيه' },
    'حرج': { color: 'text-rose-400 bg-rose-400/10 animate-pulse', icon: AlertCircle, label: 'عاجل!' }
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
};
