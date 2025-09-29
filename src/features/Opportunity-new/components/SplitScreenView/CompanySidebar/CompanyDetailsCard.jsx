import React from "react";
import { User, Phone, Mail, Smartphone } from "lucide-react";

const CompanyDetailsCard = ({
  editableCompanyData,
  editingField,
  tempValue,
  setTempValue,
  tempExt,
  setTempExt,
  tempFirstName,
  setTempFirstName,
  tempLastName,
  setTempLastName,
  startEditing,
  saveEdit,
  handleKeyDown,
}) => {
  // Helper function to format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value) => {
    if (!value) return value;

    // Remove all non-numeric characters
    const phoneNumber = value.replace(/[^\d]/g, "");

    // Format based on length
    if (phoneNumber.length < 4) {
      return phoneNumber;
    } else if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
        3,
        6
      )}-${phoneNumber.slice(6, 10)}`;
    }
  };

  // Helper function to format phone with extension
  const formatPhoneWithExtension = (phone, ext) => {
    if (!phone && !ext) return "No phone number";
    const formattedPhone = formatPhoneNumber(phone) || "";
    const extStr = ext ? ` (${ext})` : "";
    return `${formattedPhone}${extStr}`.trim();
  };

  // Helper function to handle phone input change with formatting
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setTempValue(formatted);
  };

  // Helper function to get display name
  const getDisplayName = () => {
    if (editableCompanyData?.firstName || editableCompanyData?.lastName) {
      return `${editableCompanyData?.firstName || ""} ${
        editableCompanyData?.lastName || ""
      }`.trim();
    }
    return editableCompanyData?.name || "No contact name";
  };

  return (
    <div className="p-4 border-b border-gray-200">
      {/* Contact Information Grid - Editable */}
      <div className="space-y-3">
        {/* Row 1: Contact Person and Phone */}
        <div className="grid grid-cols-2 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
            {editingField === "name" ? (
              <div
                className="flex gap-0.5 flex-1 min-w-0"
                onBlur={(e) => {
                  // Only save if the focus is moving outside the entire name editing container
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    saveEdit("name");
                  }
                }}
              >
                <input
                  type="text"
                  value={tempFirstName}
                  onChange={(e) => setTempFirstName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "name")}
                  className="text-sm text-gray-900 bg-white border border-blue-300 rounded px-1 py-1 flex-1 min-w-0 focus:outline-none focus:ring-0 focus:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="First Name"
                  autoFocus
                />
                <input
                  type="text"
                  value={tempLastName}
                  onChange={(e) => setTempLastName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "name")}
                  className="text-sm text-gray-900 bg-white border border-blue-300 rounded px-1 py-1 flex-1 min-w-0 focus:outline-none focus:ring-0 focus:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Last Name"
                />
              </div>
            ) : (
              <span
                onClick={() => startEditing("name", getDisplayName())}
                className="text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex-1 min-w-0 truncate"
              >
                {getDisplayName()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
            {editingField === "phone" ? (
              <div
                className="flex gap-0.5 items-center flex-1 min-w-0"
                onBlur={(e) => {
                  // Only save if the focus is moving outside the entire phone editing container
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    saveEdit("phone");
                  }
                }}
              >
                <input
                  type="text"
                  value={tempValue}
                  onChange={handlePhoneChange}
                  onKeyDown={(e) => handleKeyDown(e, "phone")}
                  className="text-sm text-gray-900 bg-white border border-blue-300 rounded px-1 py-1 flex-1 min-w-0 focus:outline-none focus:ring-0 focus:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Phone"
                  autoFocus
                />
                <span className="text-sm text-gray-500 px-1 flex-shrink-0">
                  ext
                </span>
                <input
                  type="text"
                  value={tempExt}
                  onChange={(e) => setTempExt(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "phone")}
                  className="text-sm text-gray-900 bg-white border border-blue-300 rounded px-1 py-1 w-12 flex-shrink-0 focus:outline-none focus:ring-0 focus:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder=""
                />
              </div>
            ) : (
              <span
                onClick={() =>
                  startEditing("phone", editableCompanyData?.phone || "")
                }
                className="text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex-1 min-w-0 truncate"
              >
                {formatPhoneWithExtension(
                  editableCompanyData?.phone,
                  editableCompanyData?.ext
                )}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Mobile Phone and Email */}
        <div className="grid grid-cols-2 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="h-4 w-4 text-green-600 flex-shrink-0" />
            {editingField === "mobile" ? (
              <input
                type="text"
                value={tempValue}
                onChange={handlePhoneChange}
                onBlur={() => saveEdit("mobile")}
                onKeyDown={(e) => handleKeyDown(e, "mobile")}
                className="text-sm text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none focus:ring-0 focus:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <span
                onClick={() =>
                  startEditing("mobile", editableCompanyData?.mobile || "")
                }
                className="text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex-1 min-w-0 truncate"
              >
                {formatPhoneNumber(editableCompanyData?.mobile) ||
                  "No mobile number"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
            {editingField === "email" ? (
              <input
                type="email"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => saveEdit("email")}
                onKeyDown={(e) => handleKeyDown(e, "email")}
                className="text-sm text-blue-600 bg-white border border-blue-300 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none focus:ring-0 focus:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <span
                onClick={() =>
                  startEditing("email", editableCompanyData?.email || "")
                }
                className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 transition-colors flex-1 min-w-0 truncate"
              >
                {editableCompanyData?.email || "No email address"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsCard;
