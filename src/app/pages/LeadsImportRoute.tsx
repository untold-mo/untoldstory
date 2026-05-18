import { Toaster } from 'sonner';
import { DataProvider } from '@/app/context/DataContext';
import LeadsImportPage from '@/app/pages/LeadsImportPage';

/** مسار مستقل مع نفس مزوّد البيانات حتى يعمل تسجيل الدخول والاستيراد. */
export default function LeadsImportRoute() {
  return (
    <DataProvider>
      <Toaster position="top-center" richColors theme="dark" />
      <LeadsImportPage />
    </DataProvider>
  );
}
