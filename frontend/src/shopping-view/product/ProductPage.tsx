import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link,
  useParams,
  useOutletContext,
  useNavigate
} from "react-router-dom";
import { toast } from "react-toastify";
import RelatedProducts from "@/components/related-products";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import axios from "axios";
import { useLanguageItem } from "@/hooks/useLanguageItem";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import ProductReview from "@/components/product-review";

interface AttributeOption {
  value: string;
  label: string;
  price: number;
  color?: string | null;
  image?: string | null;
}

interface AttributeGroup {
  parent_id: number | null;
  parent_name: string;
  type: string;
  options: AttributeOption[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  images: string[];
  description: string;
  content: string;
  features: string[];
  specifications: Record<string, string>;
  attributes: AttributeGroup[];
  category_id?: number;
}

interface LayoutContext {
  selectedLangId: number;
  setSelectedLangId: React.Dispatch<React.SetStateAction<number>>;
}

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { selectedLangId } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const { getLanguageItem } = useLanguageItem(selectedLangId);
  const [selectedWarranties, setSelectedWarranties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToRecentlyViewed } = useRecentlyViewed({ selectedLangId });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (product?.id) {
      addToRecentlyViewed(product.id.toString());
    }
  }, [product?.id, addToRecentlyViewed]);

  const [prevLangId, setPrevLangId] = useState<number>(selectedLangId);

  useEffect(() => {
    if (prevLangId !== undefined && prevLangId !== selectedLangId) {
      navigate("/");
    }
    setPrevLangId(selectedLangId);
  }, [selectedLangId, navigate, prevLangId]);

  const fetchReviewStats = async (productId: number) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/shopping/products/${productId}/reviews/stats`,
        { headers: { "Accept-Language": selectedLangId.toString() } }
      );
      if (response.data.success) {
        setReviewStats({
          averageRating: response.data.data.average_rating,
          totalReviews: response.data.data.total_reviews
        });
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const response = await axios.get<any>(
          `http://localhost:8000/api/shopping/products/${slug}`,
          {
            params: { lang_id: selectedLangId },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        let attributesArray: AttributeGroup[] = [];
        if (
          response.data.attributes &&
          typeof response.data.attributes === "object"
        ) {
          if (Array.isArray(response.data.attributes)) {
            attributesArray = response.data.attributes;
          } else {
            attributesArray = Object.values(response.data.attributes);
          }
        }

        const updatedProduct: Product = {
          ...response.data,
          attributes: attributesArray
        };

        setProduct(updatedProduct);

        const initialSelections: Record<string, string> = {};
        attributesArray.forEach((group) => {
          if (group.options.length > 0 && group.parent_name !== "Warranty") {
            initialSelections[group.parent_id || group.parent_name] =
              group.options[0].value;
          }
        });
        setSelectedAttributes(initialSelections);

        if (response.data.id) {
          fetchReviewStats(response.data.id);
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);
        if (error.response?.status === 404) {
          toast.error("Sản phẩm không tồn tại");
        } else {
          toast.error("Đã có lỗi xảy ra khi tải sản phẩm");
        }
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug, selectedLangId, navigate]);

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAttributeChange = (parentId: string | number, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [parentId]: value }));
  };

  const handleWarrantyToggle = (value: string) => {
    setSelectedWarranties((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    let total = product.price;

    if (Array.isArray(product.attributes)) {
      product.attributes.forEach((group) => {
        const selectedValue =
          selectedAttributes[group.parent_id || group.parent_name];
        const selectedOption = group.options.find(
          (option) => option.value === selectedValue
        );
        if (selectedOption && selectedOption.price > 0) {
          total += selectedOption.price;
        }
        if (group.parent_name === "Warranty") {
          group.options.forEach((option) => {
            if (selectedWarranties.includes(option.value) && option.price > 0) {
              total += option.price;
            }
          });
        }
      });
    }

    return total * quantity;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const attributeIds = Object.values(selectedAttributes).filter(
      (id) => id !== ""
    );

    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity, attributeIds, selectedLangId);
      toast.success("Đã thêm sản phẩm vào giỏ hàng");
      setQuantity(1);
    } catch (error: any) {
      toast.error(
        "Không thể thêm vào giỏ hàng: " +
          (error.response?.data?.message || error.message)
      );
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleReviewAdded = () => {
    if (product) {
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              reviews: prev.reviews + 1
            }
          : null
      );
      if (product.id) {
        fetchReviewStats(product.id);
      }
    }
  };

  const renderAttributeGroup = (group: AttributeGroup) => {
    const parentId = group.parent_id || group.parent_name;
    const isWarranty = group.parent_name === "Warranty";

    const normalizedType = group.type.toLowerCase();
    let typeCode = group.type;

    if (normalizedType === "color" || normalizedType === "2") {
      typeCode = "2";
    } else if (
      normalizedType === "storage" ||
      normalizedType === "screen" ||
      normalizedType === "text" ||
      normalizedType === "1"
    ) {
      typeCode = "1";
    } else if (
      normalizedType === "dropdown" ||
      normalizedType === "select" ||
      normalizedType === "3"
    ) {
      typeCode = "3";
    } else if (normalizedType === "image" || normalizedType === "4") {
      typeCode = "4";
    }

    switch (typeCode) {
      case "1":
        return (
          <div key={parentId} className="space-y-3">
            <label className="text-sm font-semibold">
              {group.parent_name}{" "}
              {!isWarranty && <span className="text-red-500">*</span>}
            </label>
            {isWarranty ? (
              <div className="space-y-2">
                {group.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWarranties.includes(option.value)}
                        onChange={() => handleWarrantyToggle(option.value)}
                        className="peer h-5 w-5 rounded border-2 border-border appearance-none checked:bg-primary checked:border-primary cursor-pointer transition-all"
                      />
                      <Check className="absolute h-3 w-3 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(option.price)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleAttributeChange(parentId, option.value)
                    }
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      selectedAttributes[parentId] === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    {option.price > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        +{(option.price / 1000000).toFixed(1)}tr
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case "2":
        return (
          <div key={parentId} className="space-y-3">
            <label className="text-sm font-semibold">
              {group.parent_name} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    handleAttributeChange(
                      group.parent_id || group.parent_name || "0",
                      option.value
                    );
                    const optionIndex = group.options.findIndex(
                      (opt) => opt.value === option.value
                    );
                    if (
                      optionIndex !== -1 &&
                      optionIndex < (product?.images?.length || 0)
                    ) {
                      setSelectedImage(optionIndex);
                    }
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full border-2 transition-all relative overflow-hidden border-black hover:border-gray-400",
                    selectedAttributes[
                      group.parent_id || group.parent_name || "0"
                    ] === option.value
                      ? "border-primary ring-4 ring-cyan-700"
                      : ""
                  )}
                  style={{ backgroundColor: option.color || "#fff" }}
                  title={option.label}
                >
                  {option.image && (
                    <img
                      src={option.image}
                      alt={option.label}
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-[-2rem] left-1/2 transform -translate-x-1/2 text-center min-w-[2.5rem]">
                    <div className="text-xs font-medium">{option.label}</div>
                    {option.price > 0 && (
                      <div className="text-xs text-primary font-bold">
                        +{(option.price / 1000000).toFixed(1)}tr
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "3":
        return (
          <div key={parentId} className="space-y-3">
            <label className="text-sm font-semibold">{group.parent_name}</label>
            <select
              value={selectedAttributes[parentId] || ""}
              onChange={(e) => handleAttributeChange(parentId, e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-border bg-background hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Chọn {group.parent_name.toLowerCase()}</option>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}{" "}
                  {option.price > 0 ? `(+${formatPrice(option.price)})` : ""}
                </option>
              ))}
            </select>
          </div>
        );

      case "4":
        return (
          <div key={parentId} className="space-y-3">
            <label className="text-sm font-semibold">
              {group.parent_name} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    handleAttributeChange(parentId, option.value);
                    const optionIndex = group.options.findIndex(
                      (opt) => opt.value === option.value
                    );
                    if (
                      optionIndex !== -1 &&
                      optionIndex < (product?.images?.length || 0)
                    ) {
                      setSelectedImage(optionIndex);
                    }
                  }}
                  className={`relative group ${
                    selectedAttributes[parentId] === option.value
                      ? "ring-2 ring-primary ring-offset-2 rounded-lg"
                      : ""
                  }`}
                >
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-border">
                    <img
                      src={option.image || "/placeholder.svg"}
                      alt={option.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-center mt-1 font-medium">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted animate-pulse" />
              <div className="grid grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="h-10 w-3/4 bg-muted animate-pulse rounded mb-3" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 bg-muted animate-pulse rounded-full"
                      />
                    ))}
                  </div>
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>

              <div className="h-12 w-48 bg-muted animate-pulse rounded" />
              <div className="h-px w-full bg-muted animate-pulse" />

              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, j) => (
                      <div
                        key={j}
                        className="h-12 bg-muted animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="h-px w-full bg-muted animate-pulse" />
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                  <div className="flex items-center border-2 border-border rounded-lg">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-l" />
                    <div className="w-12 h-10 bg-muted animate-pulse" />
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-r" />
                  </div>
                </div>

                <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
                  <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 text-center space-y-2 bg-muted animate-pulse rounded-lg"
                  >
                    <div className="h-8 w-8 mx-auto bg-muted/50 rounded-full" />
                    <div className="h-4 w-32 mx-auto bg-muted/50 rounded" />
                    <div className="h-3 w-40 mx-auto bg-muted/50 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex border-b">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-32 bg-muted animate-pulse mx-6 rounded"
                />
              ))}
            </div>
            <div className="mt-6 space-y-4">
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-6 w-full bg-muted animate-pulse rounded" />
              <div className="h-6 w-5/6 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
          <p className="text-muted-foreground mb-6">
            Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Button asChild>
            <Link to="/">Quay lại trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mt-20">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
              <img
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {product.originalPrice != null &&
                product.originalPrice > product.price && (
                  <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">
                    Giảm{" "}
                    {Math.round(
                      (1 - product.price / product.originalPrice) * 100
                    )}
                    %
                  </Badge>
                )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {product.images.slice(0, 5).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/20"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(reviewStats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium ml-1">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviewStats.totalReviews.toLocaleString()}{" "}
                  {getLanguageItem("product_detail_review", "")})
                </span>
                {product.inStock && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    {getLanguageItem("product_detail_badge", "")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice != null &&
                product.originalPrice > product.price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
            </div>

            <Separator />

            {Array.isArray(product?.attributes) &&
              product?.attributes.length > 0 &&
              product?.attributes.map((group) => renderAttributeGroup(group))}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold">
                  {getLanguageItem("product_detail_amount", "")}
                </label>
                <div className="flex items-center border-2 border-border rounded-lg">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <p
                className="text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              ></p>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-semibold">
                  {getLanguageItem("product_detail_total", "")}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(calculateTotalPrice())}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {getLanguageItem("btn_add_to_cart", "")}
                  </>
                )}
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              <Card className="p-4 text-center space-y-2 border-2">
                <Truck className="h-8 w-8 mx-auto text-primary" />
                <div className="text-sm font-semibold">
                  {getLanguageItem("product_detail_free_delivery", "")}
                </div>
                <div className="text-xs text-muted-foreground">
                  Cho đơn hàng trên 500k
                </div>
              </Card>
              <Card className="p-4 text-center space-y-2 border-2">
                <Shield className="h-8 w-8 mx-auto text-primary" />
                <div className="text-sm font-semibold">
                  {getLanguageItem("product_detail_guarrentee", "")}
                </div>
                <div className="text-xs text-muted-foreground">
                  12 tháng toàn quốc
                </div>
              </Card>
              <Card className="p-4 text-center space-y-2 border-2">
                <RotateCcw className="h-8 w-8 mx-auto text-primary" />
                <div className="text-sm font-semibold">
                  {getLanguageItem("product_detail_refund", "")}
                </div>
                <div className="text-xs text-muted-foreground">
                  Miễn phí đổi trả
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                {getLanguageItem("product_detail_desc", "")}
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                {getLanguageItem("product_detail_reviewbig", "")} (
                {reviewStats.totalReviews})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6 space-y-4">
              <div dangerouslySetInnerHTML={{ __html: product.content }}></div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ProductReview
                productId={product.id}
                selectedLangId={selectedLangId}
                isAuthenticated={isAuthenticated}
                onReviewAdded={handleReviewAdded}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-12">
          <RelatedProducts
            selectedLangId={selectedLangId}
            productId={product.id}
            limit={8}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;