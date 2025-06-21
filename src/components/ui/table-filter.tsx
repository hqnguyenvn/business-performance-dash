import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableFilterProps {
  data: any[];
  field: string;
  onFilter: (field: string, values: string[]) => void;
  activeFilters: string[];
  className?: string;
}

export const TableFilter: React.FC<TableFilterProps> = ({
  data,
  field,
  onFilter,
  activeFilters,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>(activeFilters);
  const [selectAll, setSelectAll] = useState(true);

  // Get unique values for this field from the data
  const uniqueOptions = React.useMemo(() => {
    const options = data.map(item => {
      const value = item[field];
      const displayValue = item.displayValue || value;
      return {
        value: String(value || ''),
        display: String(displayValue || '(Empty)')
      };
    });

    // Remove duplicates based on value
    const seen = new Set();
    return options.filter(option => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    }).sort((a, b) => a.display.localeCompare(b.display));
  }, [data, field]);

  // Filter options based on search term
  const filteredOptions = uniqueOptions.filter(option => 
    option.display.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setSelectedValues(activeFilters);
    setSelectAll(activeFilters.length === uniqueOptions.length || activeFilters.length === 0);
  }, [activeFilters, uniqueOptions.length]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedValues(filteredOptions.map(option => option.value));
      setSelectAll(true);
    } else {
      setSelectedValues([]);
      setSelectAll(false);
    }
  };

  const handleValueToggle = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedValues(prev => [...prev, value]);
    } else {
      setSelectedValues(prev => prev.filter(v => v !== value));
    }
  };

  const applyFilter = () => {
    onFilter(field, selectedValues);
    setIsOpen(false);
  };

  const clearFilter = () => {
    setSelectedValues(uniqueOptions.map(option => option.value));
    onFilter(field, []);
    setIsOpen(false);
  };

  const hasActiveFilter = activeFilters.length > 0 && activeFilters.length < uniqueOptions.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0 ml-1",
            hasActiveFilter ? "text-blue-600" : "text-gray-400 hover:text-gray-600",
            className
          )}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Filter</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>

        <div className="p-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm cursor-pointer">
              Select All
            </label>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
          {filteredOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(checked) => handleValueToggle(option.value, Boolean(checked))}
              />
              <label 
                htmlFor={`filter-${option.value}`} 
                className="text-sm cursor-pointer flex-1 truncate"
                title={option.display}
              >
                {option.display}
              </label>
            </div>
          ))}
        </div>

        <div className="p-2 border-t flex gap-2">
          <Button size="sm" onClick={applyFilter} className="flex-1">
            <Check className="h-3 w-3 mr-1" />
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};