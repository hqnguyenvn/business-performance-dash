
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize?: number | 'all';
  onPageSizeChange?: (pageSize: number | 'all') => void;
  position?: 'top' | 'bottom';
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPreviousPage,
  totalItems,
  startIndex,
  endIndex,
  pageSize = 5,
  onPageSizeChange,
  position = 'bottom',
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className={`flex items-center ${position === 'top' ? 'justify-start gap-4' : 'justify-between'} ${position === 'top' ? '' : 'mt-4'}`}>
      {position === 'top' && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Show</span>
          <Select
            value={pageSize === 'all' ? 'all' : pageSize?.toString() || '5'}
            onValueChange={(value) => onPageSizeChange(value === 'all' ? 'all' : parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">entries</span>
        </div>
      )}

      {position === 'bottom' && (
        <div className="text-sm text-gray-700">
          Showing {startIndex} to {endIndex} of {totalItems} entries
        </div>
      )}

      {/* Khi chọn All sẽ LUÔN hiển thị nút "All", làm active và không hiện số trang khác */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={pageSize === 'all' || currentPage <= 1 ? undefined : onPreviousPage}
              className={pageSize === 'all' || currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pageSize === 'all' ? (
            // Luôn render nút All duy nhất khi pageSize === 'all'
            <PaginationItem>
              <PaginationLink isActive className="cursor-default">
                {/* Đảm bảo children là "All" */}
                All
              </PaginationLink>
            </PaginationItem>
          ) : (
            getVisiblePages().map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => onPageChange(page as number)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))
          )}
          <PaginationItem>
            <PaginationNext
              onClick={pageSize === 'all' || currentPage >= totalPages ? undefined : onNextPage}
              className={pageSize === 'all' || currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationControls;
