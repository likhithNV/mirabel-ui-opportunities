
export const useBasicInfoHandlers = (
  handleInputChange,
  handleBatchInputChange,
  apiBusinessUnits,
  apiOpportunityTypes,
  apiProducts,
  apiUsers,
  apiLossReasons,
  apiStages,
  contactOptions
) => {
  // Handle business unit selection to capture both ID and name (multiselect)
  const handleBusinessUnitChange = (values) => {
    // values is an array of selected values

    const businessUnitIds =values ;
    /* values.map(value =>
      apiBusinessUnits.find(option => option.value === value)
    ).filter(Boolean); */// Remove any undefined entries

    // Store array of selected business unit names (to match loaded data format)
    //const businessUnitNames = selectedOptions.map(option => option.name || option.label || option.value);

    // Store array of business unit IDs
   // const businessUnitIds = selectedOptions.map(value => value);

    // Store detailed business unit information
    // const businessUnitDetails = selectedOptions.map(option => ({
    //   ID: option.id,
    //   Name: option.name || option.label || option.value
    // }));

    // Use batch update to ensure all changes happen in a single React update cycle
    const batchUpdates = {
      //businessUnit: businessUnitNames,
      businessUnitId: businessUnitIds,
      businessUnitDetails: businessUnitDetails
    };


    if (handleBatchInputChange) {
      handleBatchInputChange(batchUpdates);
    } else {
      // Fallback to individual calls
     // handleInputChange("businessUnit", businessUnitNames);
      handleInputChange("businessUnitId", businessUnitIds);
      //handleInputChange("businessUnitDetails", businessUnitDetails);
    }
  };

  // Handle opportunity type selection
  const handleOpportunityTypeChange = (value) => {
    const selectedType = apiOpportunityTypes.find(type => type.value === value);
    if (selectedType) {
      handleInputChange("opportunityType", {
        id: selectedType.id,
        name: selectedType.name
      });
    } else {
      handleInputChange("opportunityType", value);
    }
  };

  // Handle product selection to capture both ID and name (multiselect)
  const handleProductChange = (values) => {
    // values is an array of selected values
    const selectedProducts = values.map(value =>
      apiProducts.find(product => product.value === value)
    ).filter(Boolean); // Remove any undefined entries

    // Store array of selected product names (to match loaded data format)
    const productNames = selectedProducts.map(product => product.name || product.label || product.value);

    // Store array of product IDs  
    const productIds = selectedProducts.map(product => product.id);

    // Store detailed product information (this is what the API expects)
    const productDetails = selectedProducts.map(product => ({
      ID: product.id,
      Name: product.name || product.label || product.value
    }));

    // Use batch update to ensure all changes happen in a single React update cycle
    const batchUpdates = {
      product: productNames,
      productId: productIds,
      productDetails: productDetails
    };

    if (handleBatchInputChange) {
      handleBatchInputChange(batchUpdates);
    } else {
      // Fallback to individual calls
      handleInputChange("product", productNames);
      handleInputChange("productId", productIds);
      handleInputChange("productDetails", productDetails);
    }
  };

  // Handle assigned rep selection to capture both ID and name
  const handleAssignedRepChange = (value) => {
    const selectedUser = apiUsers.find(user => user.value === value);
    if (selectedUser) {
      //handleInputChange("assignedRep", value);
      handleInputChange("assignedRepDetails", {
        ID: selectedUser.id,
        Name: selectedUser.name
      });
    } else {
      // handleInputChange("assignedRep", value);
      handleInputChange("assignedRepDetails", {});
    }
  };

  // Handle sales presenter selection to capture both ID and name
  const handleSalesPresenterChange = (value) => {
    const selectedUser = apiUsers.find(user => user.value === value);
    if (selectedUser) {
      //handleInputChange("salesPresentation", value);
      handleInputChange("salesPresenterDetails", {
        ID: selectedUser.id,
        Name: selectedUser.name
      });
    } else {
      handleInputChange("salesPresentation", value);
      handleInputChange("salesPresenterDetails", {});
    }
  };

  // Handle loss reason selection to capture both ID and name
  const handleLossReasonChange = (value) => {
    const selectedLossReason = apiLossReasons.find(reason => reason.value === value);
    if (selectedLossReason) {
      // Keep both the display string and full details in sync so validation clears immediately
      handleInputChange("lostReason", selectedLossReason.name || selectedLossReason.label || value);
      handleInputChange("lossReasonDetails", {
        ID: selectedLossReason.id,
        Name: selectedLossReason.name
      });
    } else {
      handleInputChange("lostReason", value);
      handleInputChange("lossReasonDetails", {});
    }
  };

  // Handle stage selection to capture both ID and name
  const handleStageChange = (value) => {
    const selectedStage = apiStages.find(stage => stage.id === value);
    if (selectedStage) {
      // Update details first, then the required field `stage` to avoid stale validation
      handleInputChange("stageDetails", {
        ID: parseInt(selectedStage.id),
        Stage: selectedStage.name || selectedStage.value,
        Description: selectedStage.description || "",
        PercentClosed: selectedStage.percentClosed || 0,
        SortOrder: selectedStage.sortOrder || 0,
        ColorCode: selectedStage.colorCode || ""
      });
     
    } else {
      // Clear stage when no valid selection
      handleInputChange("stageDetails", {
        ID: null,
        Stage: value || "",
        Description: "",
        PercentClosed: 0,
        SortOrder: 0,
        ColorCode: ""
      });

    }
  };

  // Handle contact name selection to capture both ID and name
  const handleContactNameChange = (value) => {
    const selectedContact = contactOptions.find(contact => contact.value === value);

    if (selectedContact) {
      handleInputChange("contactName", value);
      handleInputChange("contactId", selectedContact.id);
      handleInputChange("contactDetails", {
        ID: selectedContact.id,
        Name: selectedContact.name
      });
    } else {
      handleInputChange("contactName", value);
      handleInputChange("contactId", "");
      handleInputChange("contactDetails", {});
    }
  };

  return {
    handleBusinessUnitChange,
    handleOpportunityTypeChange,
    handleProductChange,
    handleAssignedRepChange,
    handleSalesPresenterChange,
    handleLossReasonChange,
    handleStageChange,
    handleContactNameChange
  };
};
