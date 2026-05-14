import React from 'react';
import { Info } from 'lucide-react';

/** يوضح أن وحدة SEO تعتمد على تخزين تجريبي محلي وليست مرتبطة ببيانات CRM/السيرفر ما لم يُربط لاحقاً. */
export function SeoDataScopeBanner() {
  return (
    <div
      className="flex gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      role="status"
    >
      <Info className="w-5 h-5 shrink-0 text-amber-300 mt-0.5" aria-hidden />
      <div>
        <p className="font-black text-amber-50">بيانات SEO تجريبية</p>
        <p className="text-[12px] text-amber-100/90 mt-1 leading-relaxed">
          الجداول والرسوم هنا من طبقة عرض/تخزين محلي للنموذج وليست مزامنة تلقائية مع قاعدة بيانات الشركة أو وضع السيرفر (CRM) ما لم يُضف ربط صريح لاحقاً.
        </p>
      </div>
    </div>
  );
}
