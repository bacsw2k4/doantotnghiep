import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import type { Language } from "../LanguageManagement";

interface Props {
  language: Language;
  isSelected: boolean;
  onCheckboxChange: (checked: boolean) => void;
  onEdit: (lang: Language) => void;
  onDelete: (id: number) => void;
}

export const LanguageRow = ({ language, isSelected, onCheckboxChange, onEdit, onDelete }: Props) => {
  return (
    <TableRow className={isSelected ? "bg-muted/50" : ""}>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onCheckboxChange} />
      </TableCell>
      <TableCell className="font-mono text-sm">{language.id}</TableCell>
      <TableCell>
        {language.image ? (
          <img
            src={`http://localhost:8000${language.image}`}
            alt={language.name}
            className="h-12 w-20 object-cover rounded border"
          />
        ) : (
          <div className="h-12 w-20 bg-gray-100 rounded border flex items-center justify-center text-xs">
            No image
          </div>
        )}
      </TableCell>
      <TableCell className="font-semibold">{language.name}</TableCell>
      <TableCell className="text-muted-foreground max-w-xs truncate">
        {language.desc || "-"}
      </TableCell>
      <TableCell className="text-center">{language.order}</TableCell>
      <TableCell>
        <Badge variant={language.status === "active" ? "default" : "secondary"}>
          {language.status === "active" ? "Hoạt động" : "Ẩn"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(language)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(language.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};