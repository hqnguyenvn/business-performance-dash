
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface CostsImportStatusProps {
  isImporting: boolean;
  importProgress?: {
    processed: number;
    total: number;
    currentBatch: number;
    totalBatches: number;
  };
}

export const CostsImportStatus = ({ isImporting, importProgress }: CostsImportStatusProps) => {
  if (!isImporting && !importProgress) return null;

  const progress = importProgress 
    ? (importProgress.processed / importProgress.total) * 100 
    : 0;

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isImporting ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Importing Cost Data...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Import Complete
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {importProgress && (
          <>
            <Progress value={progress} className="mb-2" />
            <div className="text-xs text-gray-600">
              Processing batch {importProgress.currentBatch} of {importProgress.totalBatches}
              ({importProgress.processed}/{importProgress.total} records)
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
