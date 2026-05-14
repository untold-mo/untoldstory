import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { Menu } from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role");
    if (!savedRole && location.pathname !== "/auth") {
      navigate("/auth");
    } else {
      setRole(savedRole);
    }
  }, [navigate, location.pathname]);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!role && location.pathname !== "/auth") return null;

  return (
    <div className="flex h-screen bg-[#09090B]">
      {/* Desktop Sidebar */}
      <Sidebar role={role || "owner"} />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="right" className="p-0 border-zinc-800 bg-[#18181B] w-72">
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <SheetDescription className="sr-only">قائمة التنقل الجانبية للوصول إلى صفحات النظام.</SheetDescription>
          <Sidebar role={role || "owner"} isMobile />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header role={role || "owner"} onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
