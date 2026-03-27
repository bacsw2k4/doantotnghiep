// src/pages/products/components/ProductTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductRow } from "./ProductRow";
import { useRef, useEffect } from "react";

interface Category {
  id: number;
  name: string;
  lang_id: number;
}

interface Attribute {
  id: number;
  name: string;
  parentid?: number | null;
  parentName?: string | null;
}

interface Product {
  id: number;
  lang_id: number;
  name: string;
  desc?: string;
  image?: string;
  attribute?: string;
  price?: number;
  saleprice?: number;
  totalview: number;
  order: number;
  status: string;
  categories?: Category[];
}

interface ProductTableProps {
  products: Product[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  attributes: Attribute[];
}

export const ProductTable = ({
  products,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  attributes,
}: ProductTableProps) => {
  const selectAllRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(
    null
  );

  const isAllChecked = products.length > 0 && selectedIds.length === products.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < products.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  ref={selectAllRef}
                  checked={isAllChecked}
                  onCheckedChange={(checked) => {
                    setSelectedIds(checked ? products.map((p) => p.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead className="w-24">Hình ảnh</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Thuộc tính</TableHead>
              <TableHead className="w-32">Giá</TableHead>
              <TableHead className="w-24">Lượt xem</TableHead>
              <TableHead className="w-20">Thứ tự</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-gray-500"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  attributes={attributes}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};