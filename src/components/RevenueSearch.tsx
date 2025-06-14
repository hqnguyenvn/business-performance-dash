
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface RevenueSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => void;
}

const RevenueSearch: React.FC<RevenueSearchProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2 md:w-1/3">
      <Input
        type="search"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1"
      />
      <Button variant="outline" onClick={onSearch}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default RevenueSearch;
