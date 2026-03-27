import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image, DollarSign, Eye, Calendar, User, Link2, Tags, Info, Package, FileText, Search } from "lucide-react";
import { toast } from "react-toastify";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: number;
  lang_id: number;
  name: string;
  desc?: string;
  content?: string;
  image?: string;
  attribute?: string;
  url?: string;
  author?: string;
  seotitle?: string;
  seodesc?: string;
  params?: any;
  price?: number;
  saleprice?: number;
  totalview: number;
  order: number;
  lastview?: string;
  status: string;
  categories?: Category[];
  sub_products?: SubProduct[];
}

interface Category {
  id: number;
  name: string;
  lang_id: number;
}

interface SubProduct {
  id?: number;
  product_id?: number;
  title?: string;
  content?: string;
  image?: string;
  author?: string;
  url?: string;
  status: string;
}

interface Attribute {
  id: number;
  name: string;
  parentid?: number;
  children?: Attribute[];
}

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [attributesLoading, setAttributesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setAttributesLoading(true);
      
      try {
        const [productRes, attributesRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/attributes")
        ]);
        
        setProduct(productRes.data.data);
        setAttributes(attributesRes.data.data || []);
        
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error("Không tìm thấy sản phẩm");
        } else {
          toast.error("Lỗi khi tải dữ liệu");
        }
      } finally {
        setLoading(false);
        setAttributesLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // ✅ FIXED: TÌM TRONG CẢ PARENT + CHILDREN (RECURSIVE)
  const getAttributeNames = (attributeJson: string | undefined) => {
    if (!attributeJson || attributesLoading || attributes.length === 0) {
      return [];
    }
    
    try {
      const { attribute_ids } = JSON.parse(attributeJson);
      
      // 🔍 TÌM TRONG CẢ TREE (parent + children)
      const findAllAttributes = (attrs: Attribute[]): Attribute[] => {
        let all: Attribute[] = [...attrs];
        attrs.forEach(attr => {
          if (attr.children && attr.children.length > 0) {
            all = [...all, ...findAllAttributes(attr.children)];
          }
        });
        return all;
      };
      
      const allAttributes = findAllAttributes(attributes);
      
      const names = attribute_ids
        .map((attrId: number) => {
          const attr = allAttributes.find(a => a.id === attrId);
          return attr?.name;
        })
        .filter((name: string | undefined) => name);
      
      return names;
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="w-full space-y-6">
          <Skeleton className="h-16 w-2/3 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-1 rounded-lg" />
            <Skeleton className="h-96 lg:col-span-2 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="shadow-lg border p-8 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">Không tìm thấy sản phẩm</p>
        </Card>
      </div>
    );
  }

  const hasDiscount = product.saleprice && product.price && product.saleprice < product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price! - product.saleprice!) / product.price!) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
          <Package className="h-4 w-4" />
          <span>Products</span>
          <span>/</span>
          <span className="text-black font-medium">{product.name}</span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Image & Stats */}
          <Card className="lg:col-span-1 border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="relative group mb-6">
                <img
                  src={product.image ? `http://localhost:8000/storage/${product.image}` : "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-80 object-cover rounded-lg border transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <Badge 
                  variant={product.status === "active" ? "default" : "secondary"} 
                  className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold shadow-md bg-black text-white"
                >
                  {product.status.toUpperCase()}
                </Badge>
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded text-sm font-bold shadow-md">
                    -{discountPercent}%
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border-t border-b border-gray-200 py-6 mb-6">
                <div className="space-y-3">
                  {product.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Giá gốc</span>
                      <span className={`text-2xl font-bold ${hasDiscount ? 'line-through text-gray-400' : 'text-black'}`}>
                        ${product.price}
                      </span>
                    </div>
                  )}
                  {product.saleprice && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Giá sale</span>
                      <span className="text-3xl font-bold text-black">
                        ${product.saleprice}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-medium">Lượt xem</span>
                  </div>
                  <p className="text-2xl font-bold text-black">{product.totalview}</p>
                </div>
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-medium">Thứ tự</span>
                  </div>
                  <p className="text-2xl font-bold text-black">{product.order}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Details */}
          <Card className="lg:col-span-2 border shadow-sm bg-white">
            <CardHeader className="border-b bg-black text-white py-6 px-8">
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <Info className="h-7 w-7" />
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <User className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tác giả</p>
                    <p className="font-medium text-black">{product.author || 'Không rõ'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Xem lần cuối</p>
                    <p className="font-medium text-black">{product.lastview || 'Chưa có'}</p>
                  </div>
                </div>
                {product.url && (
                  <div className="flex items-center gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow md:col-span-2">
                    <Link2 className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">URL</p>
                      <p className="font-medium text-black truncate">{product.url}</p>
                    </div>
                  </div>
                )}
                
                {/* ✅ FIXED ATTRIBUTES - SẼ HIỂN THỊ ĐÚNG! */}
                {product.attribute && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow md:col-span-2">
                    <Tags className="h-5 w-5 text-gray-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-2">Thuộc tính</p>
                      <div className="flex flex-wrap gap-2">
                        {attributesLoading ? (
                          <Skeleton className="h-6 w-20 rounded-full" />
                        ) : getAttributeNames(product.attribute).length > 0 ? (
                          getAttributeNames(product.attribute).map((name: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="px-3 py-1 text-sm border-black text-black hover:bg-black hover:text-white transition-colors"
                            >
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">Không có thuộc tính</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.desc && (
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                    <FileText className="h-5 w-5 text-black" />
                    <h3 className="font-bold text-lg text-black">Mô tả sản phẩm</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{product.desc}</p>
                </div>
              )}

              {/* Content */}
              {product.content && (
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                    <FileText className="h-5 w-5 text-black" />
                    <h3 className="font-bold text-lg text-black">Nội dung chi tiết</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{product.content}</p>
                </div>
              )}

              {/* Categories */}
              {product.categories && product.categories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                    <Tags className="h-5 w-5 text-black" />
                    <h3 className="font-bold text-lg text-black">Danh mục</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((cat) => (
                      <Badge 
                        key={cat.id} 
                        variant="outline" 
                        className="px-4 py-2 text-sm border-black text-black hover:bg-black hover:text-white transition-colors"
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SEO Section - Full Width */}
        {(product.seotitle || product.seodesc || product.params) && (
          <Card className="border shadow-sm bg-white w-full">
            <CardHeader className="border-b bg-black text-white py-5 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Search className="h-5 w-5" />
                Thông tin SEO & Tham số
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                    <p className="text-sm font-semibold text-gray-600 mb-2">SEO Title</p>
                    <p className="text-black">{product.seotitle || 'Chưa thiết lập'}</p>
                  </div>
                  <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                    <p className="text-sm font-semibold text-gray-600 mb-2">SEO Description</p>
                    <p className="text-black">{product.seodesc || 'Chưa thiết lập'}</p>
                  </div>
                </div>
                {product.params && (
                  <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Tham số</p>
                    <pre className="text-xs text-black overflow-auto bg-gray-50 p-4 rounded border max-h-64">
                      {JSON.stringify(product.params, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sub Products - Full Width */}
        {product.sub_products && product.sub_products.length > 0 && (
          <Card className="border shadow-sm bg-white w-full">
            <CardHeader className="border-b bg-black text-white py-5 px-8">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Sản phẩm liên quan ({product.sub_products.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {product.sub_products.map((sub) => (
                    <Card key={sub.id} className="border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white">
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img
                          src={sub.image ? `http://localhost:8000/storage/${sub.image}` : "/placeholder.svg"}
                          alt={sub.title || "Sub Product"}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        <Badge 
                          variant={sub.status === "active" ? "default" : "secondary"}
                          className="absolute top-3 right-3 bg-black text-white shadow-md"
                        >
                          {sub.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <h4 className="font-bold text-lg text-black line-clamp-2 min-h-[3.5rem]">
                          {sub.title || 'Không có tiêu đề'}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                          {sub.content || 'Không có nội dung'}
                        </p>
                        <div className="pt-3 border-t space-y-2 text-sm">
                          {sub.author && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <User className="h-4 w-4 text-gray-500" />
                              <span>{sub.author}</span>
                            </div>
                          )}
                          {sub.url && (
                            <div className="flex items-center gap-2 text-gray-700 truncate">
                              <Link2 className="h-4 w-4 flex-shrink-0 text-gray-500" />
                              <span className="truncate text-xs">{sub.url}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;