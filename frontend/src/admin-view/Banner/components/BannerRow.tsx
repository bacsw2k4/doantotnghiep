// src/components/banners/BannerRow.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { type Banner } from "../BannerManagement"; // bạn nên tạo type này riêng
import { Trash2, Edit } from "lucide-react";

interface BannerRowProps {
  banner: Banner;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (banner: Banner) => void;
  onDelete: (id: number) => void;
}

export const BannerRow = ({
  banner,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
}: BannerRowProps) => {
  const isSelected = selectedIds.includes(banner.id);

  const handleCheckboxChange = (checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, banner.id] : prev.filter((id) => id !== banner.id)
    );
  };

  return (
    <TableRow key={banner.id} className={isSelected ? "bg-muted/50" : ""}>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
      </TableCell>
      <TableCell className="font-mono text-sm">{banner.id}</TableCell>
      <TableCell className="max-w-xs truncate font-medium">{banner.title}</TableCell>
      <TableCell className="max-w-xs truncate">{banner.subtitle || "-"}</TableCell>
      <TableCell>
        {banner.image ? (
          <img
            src={`http://localhost:8000${banner.image}`}
            alt={banner.title}
            className="w-20 h-12 object-cover rounded border"
          />
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell>{banner.cta_text || "-"}</TableCell>
      <TableCell className="max-w-xs truncate">
        <a href={banner.cta_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {banner.cta_link || "-"}
        </a>
      </TableCell>
      <TableCell>
        {banner.badge ? (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
            {banner.badge}
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            banner.theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          {banner.theme}
        </span>
      </TableCell>
      <TableCell className="text-center">{banner.order}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            banner.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {banner.status === "active" ? "Hoạt động" : "Ẩn"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(banner)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(banner.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};