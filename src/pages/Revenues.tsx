
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import RevenueFilters from "@/components/RevenueFilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RevenueDialog from "@/components/RevenueDialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Copy, Trash2, Upload, Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Revenue,
  RevenueSearchParams,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getRevenues,
} from "@/services/revenueService";
import {
  MasterData,
  getMasterDatas,
} from "@/services/masterDataService";
import { formatCurrency } from "@/lib/format";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { addMonths, format } from "date-fns"
import { DateRange } from "react-day-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaginationControls } from "@/components/PaginationControls"
import CloneDataDialog from "@/components/CloneDataDialog"
import { NumberInput } from "@/components/ui/number-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Revenues = () => {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [customers, setCustomers] = useState<MasterData[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [projects, setProjects] = useState<MasterData[]>([]);
  const [projectTypes, setProjectTypes] = useState<MasterData[]>([]);
  const [resources, setResources] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [searchParams, setSearchParams] = useState<RevenueSearchParams>({
    year: new Date().getFullYear(),
    months: [new Date().getMonth() + 1],
    page: 1,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);
  const [revenueInDialog, setRevenueInDialog] = useState<Revenue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  })

  const fetchData = useCallback(async () => {
    try {
      const [
        revenuesData,
        customersData,
        companiesData,
        divisionsData,
        projectsData,
        projectTypesData,
        resourcesData,
        currenciesData,
      ] = await Promise.all([
        getRevenues(searchParams),
        getMasterDatas('customers'),
        getMasterDatas('companies'),
        getMasterDatas('divisions'),
        getMasterDatas('projects'),
        getMasterDatas('project_types'),
        getMasterDatas('resources'),
        getMasterDatas('currencies'),
      ]);
      setRevenues(revenuesData.data);
      setTotal(revenuesData.total);
      setCustomers(customersData);
      setCompanies(companiesData);
      setDivisions(divisionsData);
      setProjects(projectsData);
      setProjectTypes(projectTypesData);
      setResources(resourcesData);
      setCurrencies(currenciesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem fetching data.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleYearChange = (year: number) => {
    setSearchParams({ ...searchParams, year });
  };

  const handleMonthChange = (months: number[]) => {
    setSearchParams({ ...searchParams, months });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...searchParams, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams({ ...searchParams, page: 1, pageSize });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement search
  };

  const handleOpenDialog = (revenue: Revenue, mode: 'view' | 'edit') => {
    setRevenueInDialog(revenue);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSaveRevenue = async (revenue: Revenue) => {
    try {
      if (revenue.id) {
        await updateRevenue(revenue.id, revenue);
        toast({
          title: "Revenue record updated successfully!",
        });
      } else {
        await createRevenue(revenue);
        toast({
          title: "Revenue record created successfully!",
        });
      }
      fetchData();
    } catch (error) {
      console.error("Error saving revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem saving the revenue record.",
      });
    } finally {
      handleCloseDialog();
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    try {
      await deleteRevenue(id);
      setRevenues(revenues.filter((revenue) => revenue.id !== id));
      toast({
        title: "Revenue record deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem deleting the revenue record.",
      });
    }
  };

  const handleDuplicateRevenue = (revenue: Revenue) => {
    // TODO: Implement duplicate revenue
  };

  const handleImportCSV = () => {
    // TODO: Implement import CSV
  };

  const handleExportCSV = () => {
    // TODO: Implement export CSV
  };

  const handleInlineEdit = async (id: string, field: keyof Revenue, value: any) => {
    try {
      setIsInlineEditing(true);
      // Find the revenue item being edited
      const revenueToUpdate = revenues.find((revenue) => revenue.id === id);
      if (!revenueToUpdate) {
        console.error(`Revenue with id ${id} not found`);
        return;
      }

      // Optimistically update the local state
      const updatedRevenues = revenues.map((revenue) =>
        revenue.id === id ? { ...revenue, [field]: value } : revenue
      );
      setRevenues(updatedRevenues);

      // Prepare the update object
      const updateData: Partial<Revenue> = { [field]: value };

      // Call the API to update the revenue
      await updateRevenue(id, updateData);

      toast({
        title: "Revenue record updated successfully!",
      });
    } catch (error) {
      console.error("Error updating revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating the revenue record.",
      });
      // Revert the local state in case of an error
      fetchData();
    } finally {
      setIsInlineEditing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Quản lý doanh thu"
        description="Quản lý thông tin doanh thu"
      />

      <div className="p-6">
        <RevenueFilters
          selectedYear={searchParams.year}
          selectedMonths={searchParams.months}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />

        <Card>
          <CardHeader>
            <CardTitle>Danh sách doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <Input
                type="search"
                placeholder="Tìm kiếm..."
                className="md:w-1/3"
                onChange={handleSearch}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleOpenDialog({} as Revenue, 'edit')}>
                  Thêm doanh thu
                </Button>
                <Button variant="outline" onClick={handleImportCSV}>
                  <Upload className="h-4 w-4 mr-2" />
                  Nhập CSV
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Upload className="h-4 w-4 mr-2" />
                  Xuất CSV
                </Button>
                <CloneDataDialog onClone={handleCloneData} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  A list of your recent invoices.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead className="w-[50px]">Năm</TableHead>
                    <TableHead>Tháng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Công ty</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Dự án</TableHead>
                    <TableHead>Loại dự án</TableHead>
                    <TableHead>Nguồn lực</TableHead>
                    <TableHead>Tiền tệ</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">BMM</TableHead>
                    <TableHead className="text-right">Original Revenue</TableHead>
                    <TableHead className="text-right">VND Revenue</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((revenue, index) => (
                    <TableRow key={revenue.id}>
                      <TableCell className="font-medium">{(searchParams.page - 1) * searchParams.pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{revenue.year}</TableCell>
                      <TableCell>{revenue.month}</TableCell>
                      <TableCell>
                        {customers.find(c => c.id === revenue.customer_id)?.code}
                      </TableCell>
                      <TableCell>
                        {companies.find(c => c.id === revenue.company_id)?.code}
                      </TableCell>
                      <TableCell>
                        {divisions.find(d => d.id === revenue.division_id)?.code}
                      </TableCell>
                      <TableCell>
                        {projects.find(p => p.id === revenue.project_id)?.code}
                      </TableCell>
                      <TableCell>
                        {projectTypes.find(pt => pt.id === revenue.project_type_id)?.code}
                      </TableCell>
                      <TableCell>
                        {resources.find(r => r.id === revenue.resource_id)?.code}
                      </TableCell>
                      <TableCell>
                        {currencies.find(cr => cr.id === revenue.currency_id)?.code}
                      </TableCell>
                      <TableCell className="text-right">
                        <NumberInput
                          value={revenue.unit_price || 0}
                          onChange={(value) => handleInlineEdit(revenue.id, 'unit_price', value)}
                          className="w-32 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumberInput
                          value={revenue.quantity || 1}
                          onChange={(value) => handleInlineEdit(revenue.id, 'quantity', value)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumberInput
                          value={revenue.original_amount}
                          onChange={() => {}}
                          className="w-32 text-right"
                          disabled
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumberInput
                          value={revenue.vnd_revenue}
                          onChange={() => {}}
                          className="w-32 text-right"
                          disabled
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddRevenue(revenue)}
                            title="Add"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(revenue, 'view')}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(revenue, 'edit')}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDuplicateRevenue(revenue)}
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa bản ghi doanh thu này không? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRevenue(revenue.id)}>
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <PaginationControls
              total={total}
              currentPage={searchParams.page}
              pageSize={searchParams.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      </div>

      <RevenueDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        revenue={revenueInDialog}
        mode={dialogMode}
        customers={customers}
        companies={companies}
        divisions={divisions}
        projects={projects}
        projectTypes={projectTypes}
        resources={resources}
        currencies={currencies}
        onSave={handleSaveRevenue}
      />
    </div>
  );
};

export default Revenues;
