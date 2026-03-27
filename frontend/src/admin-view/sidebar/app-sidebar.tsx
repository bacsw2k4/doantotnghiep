"use client"

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  BookOpen,
  Image as ImageIcon,
  MessageSquareReply,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

const data = {
  teams: [
    {
      name: "Admin Panel",
      logo: LayoutDashboard,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      items: [
        { title: "Dashboard", url: "/admin/dashboard" }
      ],
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
      items: [
        { title: "Users", url: "/admin/users" },
        { title: "Roles", url: "/admin/roles" },
        { title: "Orders", url: "/admin/orders" },
        { title: "Review", url: "/admin/review" },
        { title: "Promotion Subscriber", url: "/admin/promotionSubscriber" }
      ],
    },
    
    {
      title: "Product Management",
      url: "/admin/products",
      icon: Package,
      items: [
        { title: "Products", url: "/admin/products" },
        { title: "Categories", url: "/admin/categories" },
        { title: "Attributes", url: "/admin/attributes" },
      ],
    },
    
    {
      title: "Content Management",
      url: "/admin/language",
      icon: BookOpen,
      items: [
        { title: "Languages", url: "/admin/language" },
        { title: "Language Keys", url: "/admin/languageKey" },
        { title: "Language Items", url: "/admin/languageItem" },
        { title: "Menu", url: "/admin/menus" },
      ],
    },
    
    {
      title: "Marketing",
      url: "/admin/vouchers",
      icon: ImageIcon,
      items: [
        { title: "Vouchers", url: "/admin/vouchers" },
        { title: "Banners", url: "/admin/banners" },
        { title: "Footers", url: "/admin/footers" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}