"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { X, Gift, Mail, Sparkles, Tag, TrendingUp, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguageItem } from "@/hooks/useLanguageItem"
import axios from "axios"

type PopupVariant = "modern" | "elegant"

interface PromotionPopupProps {
  variant?: PopupVariant
  delayMs?: number
  selectedLangId: number;
}

export default function PromotionPopup({ variant = "modern", delayMs = 0, selectedLangId }: PromotionPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getLanguageItem } = useLanguageItem(selectedLangId);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [delayMs, selectedLangId])

  const handleClose = () => {
    setIsOpen(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) return
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Vui lòng nhập địa chỉ email hợp lệ")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:8000/api/promotion/subscribe', {
        email: email
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (response.status === 201 || response.status === 200) {
        console.log("Newsletter subscription successful:", email)
        setIsSubmitted(true)
        
        // Reset form after successful submission
        setTimeout(() => {
          handleClose()
          setEmail("")
          setIsSubmitted(false)
        }, 2000)
      }
    } catch (error: any) {
      console.error("Subscription error:", error)
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 422) {
            setError("Email không hợp lệ. Vui lòng kiểm tra lại.")
          } else if (error.response.status === 500) {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.")
          } else {
            setError(error.response.data?.message || "Đã có lỗi xảy ra")
          }
        } else if (error.request) {
          // Request was made but no response received
          setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.")
        } else {
          // Something else happened
          setError("Đã có lỗi xảy ra. Vui lòng thử lại.")
        }
      } else {
        setError("Đã có lỗi không xác định xảy ra.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`
            relative bg-white rounded-2xl shadow-2xl pointer-events-auto
            animate-in zoom-in-95 slide-in-from-bottom-4 duration-500
            ${variant === "modern" ? "max-w-5xl w-full" : "max-w-lg w-full"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110 hover:rotate-90"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {variant === "modern" ? (
            <div className="grid md:grid-cols-5 gap-0 overflow-hidden rounded-2xl">
              <div className="md:col-span-2 relative bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-8 md:p-10 flex flex-col justify-center items-center text-white min-h-[350px] md:min-h-[550px] overflow-hidden">
                {/* ... (existing JSX remains the same) ... */}
              </div>

              <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
                {!isSubmitted ? (
                  <>
                    <div className="mb-6">
                      <div className="inline-block px-4 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-3">
                        ✨ Exclusive Offer
                      </div>
                      
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                        {getLanguageItem("promotion_title2", "")}
                      </h3>
                      
                      <p className="text-gray-600 text-lg">{getLanguageItem("promotion_description1", "")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                          
                          <Input
                            type="email"
                            placeholder={getLanguageItem("promotion_placeholder", "")}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value)
                              setError(null) // Clear error when user starts typing
                            }}
                            disabled={isSubmitting}
                            required
                            className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-violet-500 rounded-xl disabled:opacity-50"
                          />
                        </div>
                        
                        {error && (
                          <p className="text-red-500 text-sm animate-in fade-in duration-200">
                            {error}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                          </span>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            {getLanguageItem("promotion_button", "")}
                          </>
                        )}
                      </Button>
                    </form>

                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 border-2 border-white"
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-violet-600">10,000+</span> subscribers already joined!
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">{getLanguageItem("promotion_terms", "")}</p>
                  </>
                ) : (
                  <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-4 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Success!</h3>
                    <p className="text-gray-600 text-lg">{getLanguageItem("promotion_success", "")}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl">
              <div className="p-10 md:p-14">
                {!isSubmitted ? (
                  <div className="max-w-md mx-auto space-y-8">
                    <div className="text-center space-y-4 border-b border-gray-200 pb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-gray-900 mb-4">
                        <Gift className="w-8 h-8 text-gray-900" />
                      </div>
                      
                      <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
                        {getLanguageItem("promotion_title2", "")}
                      </h2>
                      
                      <p className="text-sm uppercase tracking-widest text-gray-500 font-medium">
                        {getLanguageItem("promotion_subtitle2", "")}
                      </p>
                    </div>

                    <p className="text-center text-gray-600 leading-relaxed">
                      {getLanguageItem("promotion_description2", "")}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder={getLanguageItem("promotion_placeholder", "")}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value)
                              setError(null)
                            }}
                            disabled={isSubmitting}
                            required
                            className="h-12 text-base border-0 border-b-2 border-gray-300 focus:border-gray-900 rounded-none px-0 focus-visible:ring-0 disabled:opacity-50"
                          />
                        </div>
                        
                        {error && (
                          <p className="text-red-500 text-sm animate-in fade-in duration-200">
                            {error}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isSubmitting || !email}
                        className="w-full h-12 text-sm font-medium uppercase tracking-wider bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                          </span>
                        ) : (
                          getLanguageItem("promotion_button", "")
                        )}
                      </Button>
                    </form>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                      <div className="text-center">
                        <TrendingUp className="w-5 h-5 mx-auto mb-2 text-gray-700" />
                        <p className="text-xs text-gray-600">{getLanguageItem("promotion_feature1", '')}</p>
                      </div>
                      <div className="text-center">
                        <Star className="w-5 h-5 mx-auto mb-2 text-gray-700" />
                        <p className="text-xs text-gray-600">{getLanguageItem("promotion_feature2", "")}</p>
                      </div>
                      <div className="text-center">
                        <Tag className="w-5 h-5 mx-auto mb-2 text-gray-700" />
                        <p className="text-xs text-gray-600">{getLanguageItem("promotion_feature3", "")}</p>
                      </div>
                    </div>

                    <p className="text-xs text-center text-gray-400 leading-relaxed">
                      {getLanguageItem("promotion_terms", "")}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-gray-900 mb-6">
                      <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div> 
                    <h3 className="text-3xl font-light text-gray-900 mb-3">Thank You</h3>
                    <p className="text-gray-600">{getLanguageItem("promotion_success", "")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}