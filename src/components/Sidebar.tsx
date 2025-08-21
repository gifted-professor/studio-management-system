"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  ShoppingCart,
  Phone,
  Upload,
  BarChart3,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "仪表盘", href: "/", icon: Home },
  { name: "会员管理", href: "/members", icon: Users },
  { name: "订单管理", href: "/orders", icon: ShoppingCart },
  { name: "催单管理", href: "/followups", icon: Phone },
  { name: "数据导入", href: "/import", icon: Upload },
  { name: "数据统计", href: "/dashboard", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border shadow-lg">
      {/* Logo区域 */}
      <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-sidebar-foreground">
              寰球奥莱会员
            </h1>
            <p className="text-xs text-sidebar-foreground/60">管理系统</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative
                ${
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-2 border-primary/30 shadow-lg font-semibold"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-primary/5 border-2 border-transparent"
                }
              `}
            >
              {/* 激活状态的左侧指示条 */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
              )}
              
              <item.icon
                className={`
                  mr-3 h-5 w-5 transition-colors duration-200
                  ${
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground/50 group-hover:text-primary/70"
                  }
                `}
              />
              {item.name}

              {/* 活跃状态指示器 */}
              {isActive && (
                <div className="ml-auto flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 底部设置区域 */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/settings"
          className="group flex items-center px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-primary/5 rounded-xl transition-all duration-200 border-2 border-transparent"
        >
          <Settings className="mr-3 h-5 w-5 text-sidebar-foreground/50 group-hover:text-primary/70" />
          设置
        </Link>

        {/* 版本信息 */}
        <div className="mt-4 px-4 py-2 bg-sidebar-accent/20 rounded-lg">
          <p className="text-xs text-sidebar-foreground/50 text-center">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
