import { useEffect, useRef, useState, useCallback } from "react";
import { ShoppingCart, Plus, Minus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom"; 
import { useCart } from "@/hooks/useCart";

interface CartComponentProps {
  className?: string;
  selectedLangId: number;
}

export const CartComponent: React.FC<CartComponentProps> = ({
  className,
  selectedLangId
}) => {
  const {
    cartItems,
    totalItems,
    totalPrice,
    loading,
    needsRefetch,
    fetchCartItems,
    updateQuantity,
    removeItem,
    markForRefetch,
    clearNeedsRefetch
  } = useCart();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate(); 
  const hasFetched = useRef(false);
  const isFetchingRef = useRef(false);

  // Refetch tự động khi sheet mở
  const refetchCart = useCallback(async (force = false) => {
    if (!isOpen || isFetchingRef.current) return;
    
    console.log("Refetching cart...");
    isFetchingRef.current = true;
    setIsRefreshing(true);
    try {
      await fetchCartItems(selectedLangId, force);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [isOpen, selectedLangId, fetchCartItems]);

  // Initial fetch chỉ một lần khi component mount
  useEffect(() => {
    if (!hasFetched.current) {
      fetchCartItems(selectedLangId);
      hasFetched.current = true;
    }
  }, [selectedLangId, fetchCartItems]);

  // Chỉ refetch khi mở sheet và có nhu cầu refetch (needsRefetch = true)
  useEffect(() => {
    if (isOpen && needsRefetch && !isRefreshing) {
      console.log("Cart needs refetch, refetching now...");
      refetchCart(true);
      clearNeedsRefetch();
    }
  }, [isOpen, needsRefetch, isRefreshing, refetchCart, clearNeedsRefetch]);

  // Refetch khi mở sheet lần đầu
  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      refetchCart();
    }
  }, [isOpen, refetchCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(id, selectedLangId);
    } else {
      await updateQuantity(id, quantity, selectedLangId);
    }
  };

  const handleRefresh = async () => {
    await refetchCart(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Đánh dấu cần fetch khi mở sheet
      markForRefetch();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative group", className)}
        >
          <ShoppingCart className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          {totalItems > 0 && (
            <Badge 
              className={cn(
                "absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs animate-in zoom-in-50 duration-200",
                needsRefetch && "animate-pulse bg-green-600"
              )}
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between w-full">
            <SheetTitle className="flex items-center gap-2">
              <span>Giỏ hàng ({totalItems})</span>
              {needsRefetch && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  Cập nhật...
                </Badge>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn(
                "w-4 h-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading || isRefreshing ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">Đang tải giỏ hàng...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Giỏ hàng trống
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm
              </p>
              <Button onClick={() => setIsOpen(false)}>Tiếp tục mua sắm</Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cartItems.map((item: any, index: any) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in-0 slide-in-from-right-2 duration-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
                          {item.name}
                        </h4>
                        {item.variant ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.variant}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id, selectedLangId)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={loading || isRefreshing}
                          className="h-7 w-7 p-0 rounded-full"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={loading || isRefreshing}
                          className="h-7 w-7 p-0 rounded-full"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Tạm tính
                </span>
                <span className="font-medium">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Phí vận chuyển
                </span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Tổng cộng</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full h-12 text-base font-medium"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/cart");
                }}
                disabled={loading || isRefreshing}
              >
                Xem giỏ hàng chi tiết
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 bg-transparent"
                onClick={() => setIsOpen(false)}
                disabled={loading || isRefreshing}
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};