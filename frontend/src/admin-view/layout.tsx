import { AppSidebar } from "./sidebar/app-sidebar" 
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import axios from "axios";

interface Language {
  id: number;
  name: string;
  image?: string;
  desc?: string;
  order: number;
  status: string;
}

export default function AdminLayout() {
  const [selectedLangId, setSelectedLangId] = useState<number>(1);
  const [languages, setLanguages] = useState<Language[]>([]);

  const languageApi = axios.create({
    baseURL: "http://localhost:8000/api/languages",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchLanguages = async () => {
    try {
      const res = await languageApi.get("/");
      setLanguages(res.data.data || []);
    } catch {
      toast.error("Không lấy được danh sách ngôn ngữ");
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center justify-around gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-end gap-2">
              <Select value={selectedLangId.toString()} onValueChange={(v) => setSelectedLangId(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id.toString()}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet context={{ selectedLangId, setSelectedLangId, languages }} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}