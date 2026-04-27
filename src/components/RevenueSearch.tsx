
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface RevenueSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  /** Optional. When provided, Enter/click "applies" the term (useful for deferred search). */
  onSearch?: () => void;
}

const RevenueSearch: React.FC<RevenueSearchProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) onSearch();
  };

  return (
    <div className="flex gap-2 w-full sm:w-72">
      <Input
        type="search"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1"
      />
      {onSearch && (
        <Button variant="outline" onClick={onSearch}>
          <Search className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default RevenueSearch;
