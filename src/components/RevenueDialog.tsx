
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Revenue } from "@/types/revenue";
import { MasterData } from "@/services/masterDataService";

interface RevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue: Revenue | null;
  mode: 'view' | 'edit';
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
  onSave: (revenue: Revenue) => void;
}

const RevenueDialog: React.FC<RevenueDialogProps> = ({
  open,
  onOpenChange,
  revenue,
  mode,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
  onSave,
}) => {
  const [editedRevenue, setEditedRevenue] = useState<Revenue | null>(null);

  useEffect(() => {
    if (revenue) {
      setEditedRevenue({ ...revenue });
    }
  }, [revenue]);

  const handleSave = () => {
    if (editedRevenue) {
      onSave(editedRevenue);
      onOpenChange(false);
    }
  };

  const handleChange = (field: keyof Revenue, value: any) => {
    if (editedRevenue) {
      setEditedRevenue({
        ...editedRevenue,
        [field]: value,
      });
    }
  };

  const getFilteredProjects = (customerId: string) => {
    if (!customerId) return projects;
    return projects.filter(project => project.customer_id === customerId);
  };

  const isReadOnly = mode === 'view';

  if (!revenue || !editedRevenue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' ? 'View Revenue Record' : 'Edit Revenue Record'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' 
              ? 'View revenue record details' 
              : 'Edit revenue record details'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Year</Label>
            <Input
              value={editedRevenue.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
            />
          </div>
          
          <div>
            <Label>Month</Label>
            <Input
              value={editedRevenue.month}
              onChange={(e) => handleChange('month', parseInt(e.target.value) || 0)}
              disabled={isReadOnly}
            />
          </div>
          
          <div>
            <Label>Customer</Label>
            <Select
              value={editedRevenue.customer_id || ""}
              onValueChange={(value) => handleChange('customer_id', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Company</Label>
            <Select
              value={editedRevenue.company_id || ""}
              onValueChange={(value) => handleChange('company_id', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Division</Label>
            <Select
              value={editedRevenue.division_id || ""}
              onValueChange={(value) => handleChange('division_id', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((division) => (
                  <SelectItem key={division.id} value={division.id}>
                    {division.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Project</Label>
            <Select
              value={editedRevenue.project_id || ""}
              onValueChange={(value) => handleChange('project_id', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {getFilteredProjects(editedRevenue.customer_id || "").map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Project Type</Label>
            <Select
              value={editedRevenue.project_type_id || ""}
              onValueChange={(value) => handleChange('project_type_id', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((projectType) => (
                  <SelectItem key={projectType.id} value={projectType.id}>
                    {projectType.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Resource</Label>
            <Select
              value={editedRevenue.resource_id || ""}
              onValueChange={(value) => handleChange('resource_id', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resource" />
              </SelectTrigger>
              <SelectContent>
                {resources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Currency</Label>
            <Select
              value={editedRevenue.currency_id || ""}
              onValueChange={(value) => handleChange('currency_id', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Unit Price</Label>
            <NumberInput
              value={editedRevenue.unit_price || 0}
              onChange={(value) => handleChange('unit_price', value)}
              disabled={isReadOnly}
            />
          </div>
          
          <div>
            <Label>BMM</Label>
            <NumberInput
              value={editedRevenue.quantity || 1}
              onChange={(value) => handleChange('quantity', value)}
              disabled={isReadOnly}
            />
          </div>
          
          <div>
            <Label>Original Revenue</Label>
            <NumberInput
              value={editedRevenue.original_amount}
              onChange={() => {}}
              disabled
            />
          </div>
          
          <div>
            <Label>VND Revenue</Label>
            <NumberInput
              value={editedRevenue.vnd_revenue}
              onChange={() => {}}
              disabled
            />
          </div>
          
          <div className="col-span-2">
            <Label>Notes</Label>
            <Input
              value={editedRevenue.notes || ""}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {mode === 'edit' && (
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RevenueDialog;
