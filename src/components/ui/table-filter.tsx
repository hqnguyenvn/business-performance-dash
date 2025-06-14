
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
  displayOptions?: { id: any; code: string }[];
}

export const TableFilter: React.FC<TableFilterProps> = ({
  data,
  field,
  onFilter,
  activeFilters,
  className,
  displayOptions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>(activeFilters);
  const [selectAll, setSelectAll] = useState(true);

  // Get unique values for this field
  const uniqueValues = React.useMemo(() => {
    const values = data.map(item => {
      const value = item[field];
      if (value === null || value === undefined) return "";
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    });
    return [...new Set(values)].sort();
  }, [data, field]);

  // Get display values if display options are provided
  const getDisplayValue = (value: string) => {
    if (displayOptions) {
      const option = displayOptions.find(opt => String(opt.id) === value);
      return option ? option.code : value;
    }
    return value;
  };

  // Filter values based on search term
  const filteredValues = uniqueValues.filter(value => {
    const displayValue = getDisplayValue(value);
    return displayValue.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    setSelectedValues(activeFilters);
    setSelectAll(activeFilters.length === uniqueValues.length || activeFilters.length === 0);
  }, [activeFilters, uniqueValues.length]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedValues(filteredValues);
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
    setSelectedValues(uniqueValues);
    onFilter(field, []);
    setIsOpen(false);
  };

  const hasActiveFilter = activeFilters.length > 0 && activeFilters.length < uniqueValues.length;

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
          {filteredValues.map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${value}`}
                checked={selectedValues.includes(value)}
                onCheckedChange={(checked) => handleValueToggle(value, Boolean(checked))}
              />
              <label 
                htmlFor={`filter-${value}`} 
                className="text-sm cursor-pointer flex-1 truncate"
                title={getDisplayValue(value)}
              >
                {getDisplayValue(value) || "(Empty)"}
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
