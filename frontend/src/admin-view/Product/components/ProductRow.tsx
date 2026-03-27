// src/pages/products/components/ProductRow.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

interface ProductRowProps {
  product: Product;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  attributes: Attribute[];
}

export const ProductRow = ({
  product,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  attributes,
}: ProductRowProps) => {
  const isSelected = selectedIds.includes(product.id);
  const navigate = useNavigate();

  const handleCheckboxChange = (checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, product.id] : prev.filter((id) => id !== product.id)
    );
  };

  const getAttributeNames = (attributeJson: string | undefined) => {
    if (!attributeJson) return "-";
    try {
      const { attribute_ids } = JSON.parse(attributeJson);
      if (!attribute_ids || attribute_ids.length === 0) return "-";

      const grouped: { [key: number]: { parent: Attribute | null; children: Attribute[] } } = {};

      attribute_ids.forEach((id: number) => {
        const attr = attributes.find((a) => a.id === id);
        if (!attr) return;

        if (attr.parentid) {
          const parent = attributes.find((a) => a.id === attr.parentid);
          if (parent) {
            if (!grouped[parent.id]) {
              grouped[parent.id] = { parent, children: [] };
            }
            grouped[parent.id].children.push(attr);
          }
        } else {
          if (!grouped[attr.id]) {
            grouped[attr.id] = { parent: attr, children: [] };
          }
        }
      });

      const result = Object.values(grouped)
        .map((group) => {
          if (group.children.length > 0) {
            const childNames = group.children.map((child) => child.name).join(", ");
            return `${group.parent?.name}: ${childNames}`;
          }
          return group.parent?.name || "";
        })
        .filter((str) => str)
        .join(" - ");

      return result || "-";
    } catch {
      return "-";
    }
  };

  return (
    <TableRow key={product.id} className={isSelected ? "bg-muted/50" : ""}>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
      </TableCell>
      <TableCell className="font-mono text-sm">{product.id}</TableCell>
      <TableCell>
        {product.image ? (
          <img
            src={product.image.startsWith("http") ? product.image : `http://localhost:8000/storage/${product.image}`}
            alt={product.name}
            className="w-10 h-10 rounded object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell className="max-w-xs truncate">
        {getAttributeNames(product.attribute)}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {product.price && (
            <div
              className={
                product.saleprice
                  ? "line-through text-gray-400 text-sm"
                  : "font-semibold"
              }
            >
              ${product.price}
            </div>
          )}
          {product.saleprice && (
            <div className="font-semibold text-black">
              ${product.saleprice}
            </div>
          )}
          {!product.price && !product.saleprice && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-gray-600">{product.totalview}</TableCell>
      <TableCell className="text-gray-600">{product.order}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            product.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.status === "active" ? "Hoạt động" : "Ngừng"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/products/${product.id}`)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(product)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(product.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};