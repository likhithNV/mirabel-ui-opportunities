import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

const FormCheckboxes = ({
  isPrivate,
  setIsPrivate,
  addToTaskList,
  setAddToTaskList,
}) => {
  return (
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="private"
          className="h-4 w-4"
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
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
          id="addToTask"
          className="h-4 w-4"
          checked={addToTaskList}
          onCheckedChange={setAddToTaskList}
        />
        <label
          htmlFor="addToTask"
          className="text-sm text-gray-700 cursor-pointer"
        >
          Add to Task List
        </label>
      </div>
    </div>
  );
};

export default FormCheckboxes;
