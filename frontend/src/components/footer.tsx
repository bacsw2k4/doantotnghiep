"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  Shield,
  Headphones,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"

interface LayoutContext {
  selectedLangId: number;
  setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

interface FooterData {
  company: { title: string; links: { name: string; href: string }[] };
  support: { title: string; links: { name: string; href: string }[] };
  categories: { title: string; links: { name: string; href: string }[] };
  legal: { title: string; links: { name: string; href: string }[] };
  features: { title: string; description: string }[];
  company_description: string;
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  social_youtube?: string;
  bottom_copyright: string;
  badges: { name: string }[];
  payment_methods: { name: string; logo: string }[];
}

interface NewsletterContent {
  title: string;
  description: string;
  placeholder: string;
  button: string;
  privacy: string;
}

interface FooterProps {
  className?: string;
  langId?: number;
}

export const Footer: React.FC<FooterProps> = ({ className, langId = 1 }) => {
  const context = useOutletContext<LayoutContext | null>();
  const selectedLangId = context?.selectedLangId ?? langId;
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Log selectedLangId for debugging
  useEffect(() => {
    console.log("Selected Language ID:", selectedLangId);
  }, [selectedLangId]);

  // Hardcoded newsletter translations
  const newsletterContent: { [key in 1 | 2]: NewsletterContent } = {
    1: {
      title: "Đăng ký nhận tin khuyến mãi",
      description: "Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt qua email",
      placeholder: "Nhập email của bạn",
      button: "Đăng ký",
      privacy: "Bằng cách đăng ký, bạn đồng ý với <a href='/privacy' class='text-blue-600 dark:text-blue-400 hover:underline'>Chính sách bảo mật</a> của chúng tôi.",
    },
    2: {
      title: "Subscribe to Our Newsletter",
      description: "Receive updates on new products and special offers via email",
      placeholder: "Enter your email",
      button: "Subscribe",
      privacy: "By subscribing, you agree to our <a href='/privacy' class='text-blue-600 dark:text-blue-400 hover:underline'>Privacy Policy</a>.",
    },
  };

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/shopping/footers", {
          params: { lang_id: selectedLangId },
        });
        console.log("Footer API Response:", response.data);

        // Handle array or object response, accounting for "data" wrapper
        let data: any = {};
        if (response.data && 'data' in response.data) {
          console.log("Response has 'data' wrapper:", response.data.data);
          data = response.data.data || {};
        } else if (Array.isArray(response.data)) {
          console.log("Response is array, selecting first item:", response.data[0]);
          data = response.data[0] || {};
        } else if (response.data && typeof response.data === 'object') {
          console.log("Response is object:", response.data);
          data = response.data;
        } else {
          console.error("Unexpected response format:", response.data);
          throw new Error("Unexpected API response format");
        }

        setFooterData({
          company: {
            title: data.company?.title || (selectedLangId === 2 ? "About Us" : "Về chúng tôi"),
            links: Array.isArray(data.company?.links) ? data.company.links : [],
          },
          support: {
            title: data.support?.title || (selectedLangId === 2 ? "Customer Support" : "Hỗ trợ khách hàng"),
            links: Array.isArray(data.support?.links) ? data.support.links : [],
          },
          categories: {
            title: data.categories?.title || (selectedLangId === 2 ? "Product Categories" : "Danh mục sản phẩm"),
            links: Array.isArray(data.categories?.links) ? data.categories.links : [],
          },
          legal: {
            title: data.legal?.title || (selectedLangId === 2 ? "Policies" : "Chính sách"),
            links: Array.isArray(data.legal?.links) ? data.legal.links : [],
          },
          features: Array.isArray(data.features) && data.features.length > 0 ? data.features : [],
          company_description: data.company_description || "",
          contact_address: data.contact_address || "",
          contact_phone: data.contact_phone || "",
          contact_email: data.contact_email || "",
          social_facebook: data.social_facebook || "",
          social_instagram: data.social_instagram || "",
          social_twitter: data.social_twitter || "",
          social_youtube: data.social_youtube || "",
          bottom_copyright: data.bottom_copyright || "",
          badges: Array.isArray(data.badges) && data.badges.length > 0 ? data.badges : [],
          payment_methods: Array.isArray(data.payment_methods) && data.payment_methods.length > 0 ? data.payment_methods : [],
        });
        setError(null);
      } catch (error: any) {
        console.error("Error fetching footer:", error);
        setError(error.message || "Failed to fetch footer data");
        toast.error(selectedLangId === 2 ? "Failed to load footer data" : "Không thể tải dữ liệu footer");
        setFooterData(null);
      }
    };
    fetchFooter();
  }, [selectedLangId]);

  if (error) {
    return <div className="text-center text-red-500">{selectedLangId === 2 ? `Error: ${error}` : `Lỗi: ${error}`}</div>;
  }

  if (!footerData) {
    return <div className="text-center text-gray-500">{selectedLangId === 2 ? "No footer data to display" : "Không có dữ liệu footer để hiển thị"}</div>;
  }

  // Ensure selectedLangId is a valid key, default to 1 (Vietnamese)
  const langKey = (selectedLangId === 2 ? 2 : 1) as 1 | 2;

  return (
    <footer className={cn("bg-gray-50 dark:bg-gray-900", className)}>
      {/* Features Section */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {footerData.features.length > 0 ? (
              footerData.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    {index === 0 && <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    {index === 1 && <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    {index === 2 && <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    {index === 3 && <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{feature.title || (selectedLangId === 2 ? "Feature" : "Tính năng")}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description || (selectedLangId === 2 ? "No description" : "Không có mô tả")}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-600 dark:text-gray-400 text-sm">{selectedLangId === 2 ? "No features available" : "Không có tính năng nào"}</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ShopLogo</h2>
              {footerData.company_description && (
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{footerData.company_description}</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {footerData.contact_address && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>{footerData.contact_address}</span>
                </div>
              )}
              {footerData.contact_phone && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>{footerData.contact_phone}</span>
                </div>
              )}
              {footerData.contact_email && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>{footerData.contact_email}</span>
                </div>
              )}
            </div>

            {/* Social Media */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {langKey === 2 ? "Follow Us" : "Theo dõi chúng tôi"}
              </h3>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, href: footerData.social_facebook || "#", color: "hover:text-blue-600" },
                  { icon: Instagram, href: footerData.social_instagram || "#", color: "hover:text-pink-600" },
                  { icon: Twitter, href: footerData.social_twitter || "#", color: "hover:text-blue-400" },
                  { icon: Youtube, href: footerData.social_youtube || "#", color: "hover:text-red-600" },
                ].map((social, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className={cn("w-10 h-10 p-0 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400", social.color, "transition-colors")}
                  >
                    <a href={social.href}><social.icon className="w-5 h-5" /></a>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries({
            company: footerData.company,
            support: footerData.support,
            categories: footerData.categories,
            legal: footerData.legal,
          }).map(([key, section]) => (
            <div key={key} className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
              <ul className="space-y-2">
                {section.links && section.links.length > 0 ? (
                  section.links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedLangId === 2 ? "No links available" : "Không có liên kết"}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl">
          <div className="max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {newsletterContent[langKey].title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {newsletterContent[langKey].description}
            </p>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder={newsletterContent[langKey].placeholder}
                className="flex-1 bg-white dark:bg-gray-800"
              />
              <Button className="px-6">
                {newsletterContent[langKey].button}
              </Button>
            </div>
            <p
              className="text-xs text-gray-500 dark:text-gray-400 mt-2"
              dangerouslySetInnerHTML={{
                __html: newsletterContent[langKey].privacy,
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {footerData.bottom_copyright && <span>{footerData.bottom_copyright}</span>}
              <div className="flex items-center gap-2">
                {footerData.badges && footerData.badges.length > 0 ? (
                  footerData.badges.map((badge, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {badge.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs">{selectedLangId === 2 ? "No badges available" : "Không có huy hiệu"}</span>
                )}
              </div>
            </div>

            {/* <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                {langKey === 2 ? "Payment:" : "Thanh toán:"}
              </span>
              <div className="flex gap-2">
                {footerData.payment_methods && footerData.payment_methods.length > 0 ? (
                  footerData.payment_methods.map((method, index) => (
                    <img
                      key={index}
                      src={`${method.logo}`}
                      alt={method.name}
                      className="h-6 w-auto bg-white rounded border border-gray-200 p-1"
                    />
                  ))
                ) : (
                  <span className="text-xs">{selectedLangId === 2 ? "No payment methods available" : "Không có phương thức thanh toán"}</span>
                )}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;