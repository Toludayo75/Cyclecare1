import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  LogOut,
  CreditCard,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface SidebarProps {
  className?: string;
}

function SidebarNav({ className }: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/articles", label: "Articles", icon: FileText },
    { href: "/users", label: "Users", icon: Users },
    { href: "/ngos", label: "NGO Partners", icon: Building2 },
    { href: "/cash-donations", label: "Cash Donations", icon: CreditCard },
  ];

  return (
    <div className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border ${className}`}>
      <div className="p-6 flex items-center gap-3">
        <img src="/admin/logo.png" alt="CycleCare" className="w-9 h-9 object-contain" />
        <h1 className="text-xl font-bold text-primary tracking-tight">CycleCare Admin</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || location.startsWith(`${link.href}/`);
          
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarNav />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border flex items-center px-4 bg-card shrink-0 sticky top-0 z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarNav />
            </SheetContent>
          </Sheet>
          <img src="/admin/logo.png" alt="CycleCare" className="ml-3 w-7 h-7 object-contain" />
          <h1 className="ml-2 text-lg font-semibold text-primary">CycleCare</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
