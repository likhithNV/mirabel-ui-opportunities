
import React, { useState, useMemo } from "react";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Filter, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

const ColumnSelector = ({ columnOrder, selectedColumns, onColumnToggle }) => {
  const [activeCategory, setActiveCategory] = useState("standard");

  const columnCategories = useMemo(() => {
    const categories = {
      standard: {
        label: "Standard Fields",
        columns: ["status", "name", "company", "createdDate", "assignedRep", "amount", "projCloseDate", "actualCloseDate"]
      },
      stages: {
        label: "Opportunity Stages",
        columns: ["stage", "salesPresentation"]
      },
      proposal: {
        label: "Proposal Fields",
        columns: ["source", "leadSource", "leadType"]
      },
      history: {
        label: "Proposal History",
        columns: ["createdBy", "modifiedDate", "lastActivity"]
      }
    };

    const categorizedColumnIds = Object.values(categories).flatMap(cat => cat.columns);
    const otherColumns = columnOrder
      .filter(col => !categorizedColumnIds.includes(col.id))
      .map(col => col.id);
    
    if (otherColumns.length > 0) {
      categories.other = {
        label: "Other Fields",
        columns: otherColumns
      };
    }

    return categories;
  }, [columnOrder]);

  const availableColumns = useMemo(() => {
    let columns = columnOrder.filter(column => !selectedColumns.includes(column.id));

    const categoryColumns = columnCategories[activeCategory]?.columns || [];
    columns = columns.filter(column => categoryColumns.includes(column.id));

    return columns.slice(0, 20);
  }, [columnOrder, selectedColumns, activeCategory, columnCategories]);

  const availableCount = availableColumns.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-blue-700">Available Columns</Label>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          {availableCount} available
        </Badge>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-blue-50 border-blue-200">
          {Object.entries(columnCategories).map(([key, category]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
            {availableColumns.map((column) => (
              <div
                key={column.id}
                className="flex items-center space-x-1.5 p-1.5 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                onClick={() => onColumnToggle(column.id)}
              >
                <Plus className="h-3 w-3 text-blue-600 flex-shrink-0" />
                <Label 
                  htmlFor={column.id} 
                  className="text-xs cursor-pointer flex-1 text-gray-700 leading-tight"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>

          {availableColumns.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-white">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No available columns found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ColumnSelector;
