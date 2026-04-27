
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
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
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
  totalItems = 0,
  startIndex,
  endIndex,
  pageSize = 25,
  onPageSizeChange,
  position = 'bottom',
}) => {
  // Calculate default startIndex and endIndex if not provided
  const calculatedStartIndex = startIndex ?? Math.max(1, (currentPage - 1) * (typeof pageSize === 'number' ? pageSize : 25) + 1);
  const calculatedEndIndex = endIndex ?? Math.min(totalItems, currentPage * (typeof pageSize === 'number' ? pageSize : totalItems));

  // Default navigation functions if not provided
  const handleNextPage = onNextPage || (() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  });

  const handlePreviousPage = onPreviousPage || (() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });

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

  if (position === 'top') {
    if (!onPageSizeChange) return null;
    return (
      <div className="flex items-center gap-2">
        <Select
          value={pageSize === 'all' ? 'all' : pageSize?.toString() || '25'}
          onValueChange={(value) => onPageSizeChange(value === 'all' ? 'all' : parseInt(value))}
        >
          <SelectTrigger className="w-[70px] h-9">
            <SelectValue>
              {pageSize === 'all' ? 'All' : pageSize?.toString() || '25'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="250">250</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground whitespace-nowrap">/ page</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 mt-3 flex-wrap">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{calculatedStartIndex}</span>–<span className="font-medium text-foreground">{calculatedEndIndex}</span> of <span className="font-medium text-foreground">{totalItems}</span>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={pageSize === 'all' || currentPage <= 1 ? undefined : handlePreviousPage}
              className={pageSize === 'all' || currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pageSize === 'all' ? (
            <PaginationItem>
              <PaginationLink isActive className="cursor-default font-semibold" size="default">All</PaginationLink>
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
              onClick={pageSize === 'all' || currentPage >= totalPages ? undefined : handleNextPage}
              className={pageSize === 'all' || currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationControls;
