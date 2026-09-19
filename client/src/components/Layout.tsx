import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Library,
  FileText,
  CalendarDays,
  FolderKanban,
  GitBranch,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { to: "/", label: "工作台首页", icon: LayoutDashboard, end: true },
  { to: "/materials", label: "我的素材库", icon: Library },
  { to: "/projects", label: "项目管理", icon: FolderKanban },
  { to: "/weekly", label: "周报", icon: FileText },
  { to: "/monthly", label: "月报", icon: CalendarDays },
  { to: "/timeline", label: "时间线", icon: GitBranch },
  { to: "/growth", label: "成长沉淀", icon: TrendingUp },
];

const Layout = () => {
  return (
    <div className="flex h-screen w-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">WorkBuddy</div>
            <div className="text-xs text-slate-500">个人工作台</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-medium text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
              T
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-900">Tao</div>
              <div className="truncate text-xs text-slate-500">产品经理</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
