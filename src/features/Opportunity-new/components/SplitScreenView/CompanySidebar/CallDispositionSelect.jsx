import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../../services/apiService";

const CallDispositionSelect = ({ value, onChange, className = "" }) => {
  // Fetch call disposition options from the API
  const { data: dispositionData, isLoading: dispositionLoading } = useQuery({
    queryKey: ["callDispositions"],
    queryFn: async () => {
      const response = await apiService.get(
        "/services/Admin/Masters/MasterData/CallDisposition"
      );
      return response.content?.Data?.CallDisposition || [];
    },
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Call Disposition" />
      </SelectTrigger>
      <SelectContent
        className="bg-white border border-gray-200 shadow-lg z-[9999] min-w-[160px] max-h-[300px] overflow-y-auto"
        position="popper"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        {dispositionLoading ? (
          <SelectItem
            value="loading"
            disabled
            className="py-2 pl-8 pr-3 text-sm text-gray-500"
          >
            Loading...
          </SelectItem>
        ) : (
          dispositionData?.map((disposition) => (
            <SelectItem
              key={disposition.Value}
              value={disposition.Value.toString()}
              className="hover:bg-gray-100 cursor-pointer py-2 pl-8 pr-3 text-sm text-gray-900 focus:bg-gray-100 focus:text-gray-900"
            >
              {disposition.Display}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default CallDispositionSelect;
