import React from "react";
import CompanySidebar from "./CompanySidebar/CompanySidebar";

const SplitScreenView = ({
  children,
  selectedCompany,
  selectedCompanyData,
  opportunities,
  onCompanySelect,
  onCloseSidebar,
}) => {
  const handleCompanySelect = (company, companyData = null) => {
    if (onCompanySelect) {
      onCompanySelect(company, companyData);
    }
  };

  const handleCloseSidebar = () => {
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          selectedCompany ? "flex-1 min-w-0" : "w-full"
        } overflow-hidden flex flex-col bg-white`}
      >
        {children}
      </div>

      {/* Company Sidebar */}
      {selectedCompany && (
        <div className="w-[420px] flex-shrink-0 h-full border-l border-gray-200 bg-white overflow-hidden">
          <CompanySidebar
            key={selectedCompany}
            selectedCompany={selectedCompany}
            selectedCompanyData={selectedCompanyData}
            opportunities={opportunities}
            onClose={handleCloseSidebar}
          />
        </div>
      )}
    </div>
  );
};

export default SplitScreenView;
