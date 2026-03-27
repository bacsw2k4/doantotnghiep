import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  isLoading?: boolean;
}

export const DataTablePagination = ({
  currentPage,
  totalPages,
  perPage,
  totalItems,
  onPageChange,
  onPerPageChange,
  isLoading = false,
}: Props) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  if (totalPages <= 1 && totalItems <= perPage) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t bg-gray-50/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Hiển thị {startItem}-{endItem} của {totalItems.toLocaleString()} bản ghi
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span>Hiển thị</span>
          <Select 
            value={perPage.toString()} 
            onValueChange={(v) => { 
              onPerPageChange(Number(v)); 
              onPageChange(1); 
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>dòng</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onPageChange(1)} 
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronFirst className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onPageChange(currentPage - 1)} 
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {getPageNumbers().map((page, i) => (
              <Button
                key={i}
                variant={page === currentPage ? "default" : "outline"}
                size="icon"
                className="w-10"
                onClick={() => typeof page === "number" && onPageChange(page)}
                disabled={page === "..." || isLoading}
              >
                {page}
              </Button>
            ))}

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onPageChange(currentPage + 1)} 
              disabled={currentPage === totalPages || isLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onPageChange(totalPages)} 
              disabled={currentPage === totalPages || isLoading}
            >
              <ChevronLast className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};