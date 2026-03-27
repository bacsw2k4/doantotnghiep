"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Play, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import axios from "axios"

interface BannerSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  ctaText: string
  ctaLink: string
  badge?: string
  theme: "light" | "dark"
}

interface BannerSliderProps {
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  langId?: number
}

export const BannerSlider: React.FC<BannerSliderProps> = ({
  className,
  autoPlay = true,
  autoPlayInterval = 5000,
  langId = 1,
}) => {
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Thêm state loading

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true) // Bắt đầu loading
      try {
        const response = await axios.get("http://localhost:8000/api/shopping/banners", {
          params: { lang_id: langId },
        })
        const fetchedBanners = Array.isArray(response.data) ? response.data : response.data.data || []

        if (!Array.isArray(fetchedBanners)) {
          throw new Error("Expected an array of banners, received: " + JSON.stringify(fetchedBanners))
        }

        const mappedBanners: BannerSlide[] = fetchedBanners.map((banner: any) => ({
          id: banner.id.toString(),
          title: banner.title || "Untitled",
          subtitle: banner.subtitle || "",
          description: banner.description || "",
          image: banner.image || "/placeholder.svg",
          ctaText: banner.cta_text || "Mua ngay",
          ctaLink: banner.cta_link || "#",
          badge: banner.badge || undefined,
          theme: banner.theme || "light",
        }))
        setBannerSlides(mappedBanners)
        setError(null)
      } catch (error: any) {
        console.error("Error fetching banners:", error)
        setError(error.message || "Failed to fetch banners")
        setBannerSlides([])
      } finally {
        setIsLoading(false) // Kết thúc loading
      }
    }
    fetchBanners()
  }, [langId])

  useEffect(() => {
    if (!isPlaying || bannerSlides.length === 0 || isLoading) return // Thêm điều kiện isLoading

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isPlaying, autoPlayInterval, bannerSlides.length, isLoading]) // Thêm dependency isLoading

  const goToSlide = (index: number) => {
    if (isLoading) return // Ngăn chặn tương tác khi đang loading
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    if (isLoading) return // Ngăn chặn tương tác khi đang loading
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)
  }

  const goToNext = () => {
    if (isLoading) return // Ngăn chặn tương tác khi đang loading
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
  }

  const toggleAutoPlay = () => {
    if (isLoading) return // Ngăn chặn tương tác khi đang loading
    setIsPlaying(!isPlaying)
  }

  // Hiển thị loading skeleton
  if (isLoading) {
    return (
      <div className={cn("relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-2xl", className)}>
        {/* Skeleton cho ảnh nền */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        
        {/* Skeleton cho nội dung */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="space-y-6">
                {/* Skeleton badge */}
                <div className="w-24 h-8 bg-gray-400/50 rounded-full animate-pulse" />
                
                <div className="space-y-4">
                  {/* Skeleton tiêu đề */}
                  <div className="h-12 md:h-16 bg-gray-400/50 rounded-lg animate-pulse w-3/4" />
                  
                  {/* Skeleton phụ đề */}
                  <div className="h-6 md:h-8 bg-gray-400/50 rounded-lg animate-pulse w-1/2" />
                  
                  {/* Skeleton mô tả */}
                  <div className="space-y-2 max-w-xl">
                    <div className="h-4 bg-gray-400/50 rounded-lg animate-pulse w-full" />
                    <div className="h-4 bg-gray-400/50 rounded-lg animate-pulse w-5/6" />
                    <div className="h-4 bg-gray-400/50 rounded-lg animate-pulse w-4/6" />
                  </div>
                </div>
                
                {/* Skeleton nút */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-32 h-12 bg-gray-400/50 rounded-lg animate-pulse" />
                  <div className="w-40 h-12 bg-gray-400/50 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Skeleton cho nút điều hướng */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-400/50 animate-pulse" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-400/50 animate-pulse" />
        
        {/* Skeleton cho dots indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {[1, 2, 3].map((_, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full bg-gray-400/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500">Lỗi: {error}</div>
  }

  if (bannerSlides.length === 0) {
    return <div className="text-center text-gray-500">Không có banner nào để hiển thị</div>
  }

  return (
    <div className={cn("relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-2xl", className)}>
      <div className="relative w-full h-full">
        {bannerSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full",
            )}
          >
            <div className="relative w-full h-full">
              <img src={`http://localhost:8000${slide.image}`} alt={slide.title} className="w-full h-full object-cover" />
              <div
                className={cn(
                  "absolute inset-0",
                  slide.theme === "dark"
                    ? "bg-gradient-to-r from-black/70 via-black/50 to-transparent"
                    : "bg-gradient-to-r from-white/70 via-white/50 to-transparent",
                )}
              />
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6 lg:px-8">
                  <div className="max-w-2xl">
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-8 duration-700">
                      {slide.badge && (
                        <Badge
                          variant={slide.badge.includes("Sale") ? "destructive" : "default"}
                          className="text-sm px-4 py-2 font-medium"
                        >
                          {slide.badge}
                        </Badge>
                      )}
                      <div className="space-y-4">
                        <h1
                          className={cn(
                            "text-4xl md:text-6xl font-bold leading-tight",
                            slide.theme === "dark" ? "text-white" : "text-gray-900",
                          )}
                        >
                          {slide.title}
                        </h1>
                        <h2
                          className={cn(
                            "text-xl md:text-2xl font-medium",
                            slide.theme === "dark" ? "text-gray-200" : "text-gray-700",
                          )}
                        >
                          {slide.subtitle}
                        </h2>
                        <p
                          className={cn(
                            "text-base md:text-lg leading-relaxed max-w-xl",
                            slide.theme === "dark" ? "text-gray-300" : "text-gray-600",
                          )}
                        >
                          {slide.description}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          size="lg"
                          className="h-12 px-8 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
                          asChild
                        >
                          <a href={slide.ctaLink}>
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            {slide.ctaText}
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className={cn(
                            "h-12 px-8 text-base font-medium",
                            slide.theme === "dark"
                              ? "border-white/30 text-white hover:bg-white/10"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50",
                          )}
                        >
                          Tìm hiểu thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0 transition-all duration-200"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0 transition-all duration-200"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75",
            )}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAutoPlay}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0"
      >
        <Play className={cn("w-4 h-4 transition-transform", isPlaying && "scale-0")} />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-transform",
            !isPlaying && "scale-0",
          )}
        >
          <div className="w-1 h-4 bg-white rounded-full mr-0.5" />
          <div className="w-1 h-4 bg-white rounded-full" />
        </div>
      </Button>
    </div>
  )
}