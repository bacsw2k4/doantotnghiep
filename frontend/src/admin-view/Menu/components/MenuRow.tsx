// src/pages/menus/components/MenuRow.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { type Menu } from "../MenuManagement"; 

interface MenuRowProps {
  menu: Menu;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (menu: Menu) => void;
  onDelete: (id: number) => void;
  toggleNode: (id: number) => void;
}

export const MenuRow = ({
  menu,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  toggleNode,
}: MenuRowProps) => {
  const level = menu.level || 0;
  const hasChildren = menu.children && menu.children.length > 0;
  const canExpand = level < 2; // chỉ cho mở rộng đến cấp 3 (level 0,1,2)
  const shouldShowExpand = canExpand && (hasChildren || !menu.children_loaded);

  const indentStyle = { paddingLeft: `${level * 32 + 16}px` };

  const collectAllIds = (node: Menu): number[] => {
    const ids = [node.id];
    if (node.children) {
      node.children.forEach((child) => ids.push(...collectAllIds(child)));
    }
    return ids;
  };

  const handleCheckbox = (checked: boolean) => {
    const ids = collectAllIds(menu);
    if (checked) {
      setSelectedIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const isChecked = selectedIds.includes(menu.id);
  const hasSomeChildrenSelected = menu.children?.some((child) =>
    selectedIds.includes(child.id) || (child.children?.some((c) => selectedIds.includes(c.id)) ?? false)
  );

  return (
    <>
      <TableRow className={level > 0 ? "bg-gray-50/50" : ""}>
        <TableCell>
          <Checkbox
            checked={isChecked || hasSomeChildrenSelected}
            onCheckedChange={handleCheckbox}
          />
        </TableCell>
        <TableCell className="font-mono text-sm">{menu.id}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2" style={indentStyle}>
            {shouldShowExpand ? (
              <button
                onClick={() => toggleNode(menu.id)}
                className="p-1 hover:bg-gray-200 rounded flex items-center justify-center w-6 h-6 border border-gray-300"
                disabled={menu.children_loading}
              >
                {menu.children_loading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                ) : menu.expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-700" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <span className={level === 0 ? "font-medium" : "text-sm"}>
              {level > 0 && "↳ "}
              {menu.name}
            </span>
          </div>
        </TableCell>
        <TableCell className="max-w-xs truncate">{menu.url || "-"}</TableCell>
        <TableCell className="text-center">{menu.order}</TableCell>
        <TableCell>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              menu.status === "active"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {menu.status === "active" ? "Hoạt động" : "Ẩn"}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(menu)}>
              Sửa
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(menu.id)}>
              Xóa
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {menu.expanded &&
        menu.children?.map((child) => (
          <MenuRow
            key={child.id}
            menu={child}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEdit={onEdit}
            onDelete={onDelete}
            toggleNode={toggleNode}
          />
        ))}
    </>
  );
};