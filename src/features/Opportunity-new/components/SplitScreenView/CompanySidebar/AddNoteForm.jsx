import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import SpeechTextarea from "./SpeechTextarea";

const AddNoteForm = ({
  noteForm,
  setNoteForm,
  onAddNote,
  isSaving,
  activityTypesData,
  activityTypesLoading,
  usersData,
  usersLoading,
}) => {
  return (
    <div className=" p-3 pt-0 border-b border-gray-200">
      <div className="space-y-2">
        <div className="space-y-1">
          <SpeechTextarea
            placeholder="Notes"
            value={noteForm.note || ""}
            onChange={(value) =>
              setNoteForm((prev) => ({ ...prev, note: value }))
            }
            rows={3}
            className="min-h-[50px] bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Select
              value={noteForm.activityType || ""}
              onValueChange={(value) =>
                setNoteForm((prev) => ({ ...prev, activityType: value }))
              }
            >
              <SelectTrigger className="w-full h-8 bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent
                className="bg-white border border-gray-200 shadow-lg z-[9999] min-w-[160px] max-h-[300px] overflow-y-auto"
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
                ) : activityTypesData &&
                  Array.isArray(activityTypesData) &&
                  activityTypesData.length > 0 ? (
                  activityTypesData.map((type) => (
                    <SelectItem
                      key={type.ID || type.id || type.Value || type.value}
                      value={
                        type.Name || type.name || type.Display || type.display
                      }
                      className="hover:bg-gray-100 cursor-pointer py-2 pl-8 pr-3 text-sm text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                    >
                      {type.Name || type.name || type.Display || type.display}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="no-data"
                    disabled
                    className="py-2 pl-8 pr-3 text-sm text-gray-500"
                  >
                    No activity types available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={noteForm.assignedBy || ""}
              onValueChange={(value) =>
                setNoteForm((prev) => ({ ...prev, assignedBy: value }))
              }
            >
              <SelectTrigger className="w-full h-8 bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs">
                <SelectValue placeholder="Assigned By" />
              </SelectTrigger>
              <SelectContent
                className="bg-white border border-gray-200 shadow-lg z-[9999] min-w-[160px] max-h-[300px] overflow-y-auto"
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
                ) : usersData &&
                  Array.isArray(usersData) &&
                  usersData.length > 0 ? (
                  usersData.map((user) => (
                    <SelectItem
                      key={user.value || user.id || user.Value}
                      value={user.value || user.id || user.Value}
                      className="hover:bg-gray-100 cursor-pointer py-2 pl-8 pr-3 text-sm text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                    >
                      {user.label ||
                        user.display ||
                        user.Display ||
                        user.name ||
                        user.Name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="no-data"
                    disabled
                    className="py-2 pl-8 pr-3 text-sm text-gray-500"
                  >
                    No users available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={noteForm.assignedTo || ""}
              onValueChange={(value) =>
                setNoteForm((prev) => ({ ...prev, assignedTo: value }))
              }
            >
              <SelectTrigger className="w-full h-8 bg-white border border-gray-300 rounded-md focus:border-ocean-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent
                className="bg-white border border-gray-200 shadow-lg z-[9999] min-w-[160px] max-h-[300px] overflow-y-auto"
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
                ) : usersData &&
                  Array.isArray(usersData) &&
                  usersData.length > 0 ? (
                  usersData.map((user) => (
                    <SelectItem
                      key={user.value || user.id || user.Value}
                      value={user.value || user.id || user.Value}
                      className="hover:bg-gray-100 cursor-pointer py-2 pl-8 pr-3 text-sm text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                    >
                      {user.label ||
                        user.display ||
                        user.Display ||
                        user.name ||
                        user.Name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem
                    value="no-data"
                    disabled
                    className="py-2 pl-8 pr-3 text-sm text-gray-500"
                  >
                    No users available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={noteForm.isPrivate || false}
              onCheckedChange={(checked) =>
                setNoteForm((prev) => ({ ...prev, isPrivate: checked }))
              }
              className="border-gray-300"
            />
            <label
              htmlFor="private"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Private
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="taskList"
              checked={noteForm.addToTaskList || false}
              onCheckedChange={(checked) =>
                setNoteForm((prev) => ({ ...prev, addToTaskList: checked }))
              }
              className="border-gray-300"
            />
            <label
              htmlFor="taskList"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Add to Task List
            </label>
          </div>
        </div>

        <Button
          onClick={onAddNote}
          disabled={isSaving}
          className="w-full h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md font-medium text-xs transition-colors"
        >
          {isSaving ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
              Saving...
            </>
          ) : (
            "Add Note"
          )}
        </Button>
      </div>
    </div>
  );
};

export default AddNoteForm;
