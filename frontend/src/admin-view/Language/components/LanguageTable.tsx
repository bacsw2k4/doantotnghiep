import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageRow } from "./LanguageRow";
import type { Language } from "../LanguageManagement";

interface Props {
  languages: Language[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onEdit: (lang: Language) => void;
  onDelete: (id: number) => void;
}

export const LanguageTable = ({ languages, selectedIds, setSelectedIds, onEdit, onDelete }: Props) => {
  const isAllSelected = languages.length > 0 && selectedIds.length === languages.length;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(languages.map((l) => l.id));
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">
              <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead className="w-16">ID</TableHead>
            <TableHead className="w-32">Hình ảnh</TableHead>
            <TableHead>Tên ngôn ngữ</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className="text-center w-20">Thứ tự</TableHead>
            <TableHead className="w-28">Trạng thái</TableHead>
            <TableHead className="text-right w-32">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {languages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          ) : (
            languages.map((lang) => (
              <LanguageRow
                key={lang.id}
                language={lang}
                isSelected={selectedIds.includes(lang.id)}
                onCheckboxChange={(checked) => {
                  if (checked) {
                    setSelectedIds((prev) => [...prev, lang.id]);
                  } else {
                    setSelectedIds((prev) => prev.filter((id) => id !== lang.id));
                  }
                }}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};