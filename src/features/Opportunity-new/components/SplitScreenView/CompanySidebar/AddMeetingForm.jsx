import React from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../../services/apiService";
import { userService } from "../../../services/userService";
import SpeechTextarea from "./SpeechTextarea";
import FormCheckboxes from "./FormCheckboxes";
import TimeSelector from "@/components/ui/TimeSelector";

const AddMeetingForm = ({
  meetingForm,
  setMeetingForm,
  onAddMeeting,
  isSaving,
}) => {
  // Fetch activity types for the dropdown
  const { data: activityTypesData, isLoading: activityTypesLoading } = useQuery(
    {
      queryKey: ["activityTypes"],
      queryFn: async () => {
        const response = await apiService.get(
          "/services/Admin/Masters/MasterData/ActivityTypes"
        );
        return response.content?.Data?.ActivityTypes || [];
      },
    }
  );

  // Fetch users for both Assigned By and Assigned To dropdowns
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getUsersForDropdown(),
  });

  // Date formatting utilities
  const _formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    if (dateString.includes("-") && dateString.length === 10) {
      // If already in YYYY-MM-DD format
      if (dateString.split("-")[0].length === 4) {
        return dateString;
      }
      // If in DD-MM-YYYY format, convert to YYYY-MM-DD
      const [day, month, year] = dateString.split("-");
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };

  return (
    <div className="p-3 border-b border-gray-200 bg-gray-50">
      <div className="space-y-2">
        {/* Header with ocean-800 title color */}
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-3 w-3 text-ocean-500" />
          <span className="text-xs font-medium text-ocean-800">
            Add New Meeting
          </span>
        </div>

        {/* Activity Type without separate label */}
        <div className="space-y-1">
          <Select
            value={meetingForm.activityType}
            onValueChange={(value) =>
              setMeetingForm((prev) => ({ ...prev, activityType: value }))
            }
          >
            <SelectTrigger className="w-full h-8 bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent
              className="bg-white border border-gray-200 shadow-lg z-[9999] min-w-[160px] max-h-[300px] overflow-y-auto rounded-md"
              position="popper"
              side="bottom"
              align="start"
              sideOffset={4}
            >
              {activityTypesLoading ? (
                <SelectItem
                  value="loading"
                  disabled
                  className="py-2 pl-8 pr-3 text-sm text-gray-500"
                >
                  Loading...
                </SelectItem>
              ) : (
                activityTypesData?.map((activityType) => (
                  <SelectItem
                    key={activityType.Value}
                    value={activityType.Value.toString()}
                    className="hover:bg-gray-100 cursor-pointer py-2 pl-8 pr-3 text-sm text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                  >
                    {activityType.Display}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Date and Time Row without separate labels */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={formatDateForInput(meetingForm.scheduledDate)}
            onChange={(e) =>
              setMeetingForm((prev) => ({
                ...prev,
                scheduledDate: e.target.value,
              }))
            }
            onClick={(e) => {
              // Ensure calendar opens on any click within the input
              e.target.showPicker && e.target.showPicker();
            }}
            className="h-8 bg-white border border-gray-300 rounded-md text-xs focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer px-3 relative flex items-center justify-between w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-90 [&::-webkit-calendar-picker-indicator]:bg-no-repeat [&::-webkit-calendar-picker-indicator]:bg-center [&::-webkit-calendar-picker-indicator]:z-10"
            placeholder="dd-mm-yyyy"
            style={{
              WebkitAppearance: "none",
              colorScheme: "light",
            }}
          />
          <TimeSelector
            value={meetingForm.scheduledTime}
            onChange={(time) =>
              setMeetingForm((prev) => ({ ...prev, scheduledTime: time }))
            }
            className="w-full h-8 bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
          />
        </div>

        {/* Assigned By and Assigned To Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Select
              value={meetingForm.assignedBy}
              onValueChange={(value) =>
                setMeetingForm((prev) => ({ ...prev, assignedBy: value }))
              }
            >
              <SelectTrigger className="w-full h-8 bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs">
                <SelectValue placeholder="Assigned By" />
              </SelectTrigger>
              <SelectContent
                className="bg-white border border-gray-200 shadow-lg z-[9999] min-w-[160px] max-h-[300px] overflow-y-auto rounded-md"
                position="popper"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                {usersLoading ? (
                  <SelectItem
                    value="loading"
                    disabled
                    className="py-2 pl-8 pr-3 text-sm text-gray-500"
                  >
                    Loading...
                  </SelectItem>
                ) : (
                  usersData?.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.value}
                      className="hover:bg-gray-100 cursor-pointer py-2 pl-8 pr-3 text-sm text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                    >
                      {user.display}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={meetingForm.assignedTo}
              onValueChange={(value) =>
                setMeetingForm((prev) => ({ ...prev, assignedTo: value }))
              }
            >
              <SelectTrigger className="w-full h-8 bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent
                className="bg-white border border-gray-200 shadow-lg z-[9999] min-w-[160px] max-h-[300px] overflow-y-auto rounded-md"
                position="popper"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                {usersLoading ? (
                  <SelectItem
                    value="loading"
                    disabled
                    className="py-2 pl-8 pr-3 text-sm text-gray-500"
                  >
                    Loading...
                  </SelectItem>
                ) : (
                  usersData?.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.value}
                      className="hover:bg-gray-100 cursor-pointer py-2 pl-8 pr-3 text-sm text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                    >
                      {user.display}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Meeting Notes */}
        <div className="space-y-1">
          <SpeechTextarea
            placeholder="Meeting Notes"
            value={meetingForm.note}
            onChange={(value) =>
              setMeetingForm((prev) => ({ ...prev, note: value }))
            }
            rows={3}
            className="bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
          />
        </div>

        {/* Checkboxes with proper spacing */}
        <FormCheckboxes
          isPrivate={meetingForm.isPrivate}
          setIsPrivate={(checked) =>
            setMeetingForm((prev) => ({ ...prev, isPrivate: checked }))
          }
          addToTaskList={meetingForm.addToTaskList}
          setAddToTaskList={(checked) =>
            setMeetingForm((prev) => ({ ...prev, addToTaskList: checked }))
          }
        />

        {/* Save Meeting Button with ocean theme */}
        <Button
          onClick={onAddMeeting}
          disabled={isSaving}
          className="w-full h-8 bg-ocean-500 hover:bg-ocean-600 disabled:bg-ocean-400 disabled:cursor-not-allowed text-white rounded-lg font-medium border-ocean-500 transition-colors text-xs"
        >
          {isSaving ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
              Saving...
            </>
          ) : (
            <>
              <Calendar className="h-3 w-3 mr-1" />
              Save Meeting
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AddMeetingForm;
