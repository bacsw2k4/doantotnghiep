import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowRight } from "lucide-react"
import { useLanguageItem } from "@/hooks/useLanguageItem"
import { useOutletContext } from "react-router-dom"

interface LayoutContext {
  selectedLangId: number;
  setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

export function FeaturedBanner() {
  const bannerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const { selectedLangId } = useOutletContext<LayoutContext>();
  const { getLanguageItem } = useLanguageItem(selectedLangId);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!bannerRef.current || !imageRef.current) return

      const rect = bannerRef.current.getBoundingClientRect()
      const scrolled = window.pageYOffset
      const rate = scrolled * -0.5

      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        imageRef.current.style.transform = `translate3d(0, ${rate}px, 0)`
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section
      ref={bannerRef}
      className="relative h-[720px] overflow-hidden bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900"
    >
      {/* Parallax Background */}
      <div ref={imageRef} className="absolute inset-0 w-full h-[120%] -top-[10%]">
        <div className="relative w-full h-full">
          <img
            src="/iphone-15-pro-max-hero.jpg"
            alt="Featured Product"
            className="object-cover opacity-30"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/70 to-indigo-900/80" />
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-lg animate-bounce" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Text Content */}
          <div className="text-white space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <Badge className="bg-red-500 hover:bg-red-600 text-white">🔥 {getLanguageItem("banner_sale", "")}</Badge>
              <Badge className="bg-green-500 hover:bg-green-600 text-white">{getLanguageItem("banner_discount", "")}</Badge>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              {getLanguageItem("banner_product", "")}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                {getLanguageItem("banner_material", "")}
              </span>
            </h2>

            <p className="text-xl text-gray-200 leading-relaxed max-w-lg">
              {getLanguageItem("banner_des", "")}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-200">4.9/5 (2,341 {getLanguageItem("banner_review", "")})</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-yellow-400">{getLanguageItem("banner_price", "")}</span>
              <span className="text-xl text-gray-400 line-through">{getLanguageItem("banner_discount_price", "")}</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold group"
              >
                {getLanguageItem("banner_buy_now", "")}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black bg-transparent"
              >
                {getLanguageItem("banner_watch_detail", "")}
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 pb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm text-gray-200">{getLanguageItem("banner_free_delivery", "")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-sm text-gray-200">{getLanguageItem("banner_guarrentee", "")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span className="text-sm text-gray-200">{getLanguageItem("banner_refund", "")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-sm text-gray-200">{getLanguageItem("banner_help", "")}</span>
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="relative lg:block hidden">
            <div className="relative w-full h-96 animate-float">
              <img
                src="/iphone-15-pro-max-hero.jpg"
                alt="iPhone 15 Pro Max"
                className="object-contain drop-shadow-2xl"
              />
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-3xl blur-3xl -z-10" />
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400/20 rounded-full animate-ping" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-purple-500/20 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg
          className="relative block w-full h-16"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            className="fill-background"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            className="fill-background"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  )
}
