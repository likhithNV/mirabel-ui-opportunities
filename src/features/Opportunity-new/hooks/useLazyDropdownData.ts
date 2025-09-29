import { useState, useCallback, useRef, useEffect } from 'react';
import { opportunitiesService } from '@/features/Opportunity/Services/opportunitiesService';
import apiService from '@/features/Opportunity/Services/apiService';

// Helper function to extract List from different response structures
const extractListFromResponse = (response: any, listName = 'List') => {
  if (response && response[listName]) {
    return response[listName];
  } else if (response && Array.isArray(response)) {
    return response;
  } else if (response && response.data && response.data[listName]) {
    return response.data[listName];
  } else if (response && response.content && response.content[listName]) {
    return response.content[listName];
  }
  return [];
};

interface DropdownState {
  data: any[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

interface ContactsState extends DropdownState {
  loadedForCustomerId?: string;
}

const initialState: DropdownState = {
  data: [],
  isLoading: false,
  isLoaded: false,
  error: null
};

const initialContactsState: ContactsState = {
  data: [],
  isLoading: false,
  isLoaded: false,
  error: null,
  loadedForCustomerId: undefined
};

export const useLazyDropdownData = (formData: any, isEditMode: boolean = false) => {
  // Individual states for each dropdown
  const [opportunityTypes, setOpportunityTypes] = useState<DropdownState>(initialState);
  const [businessUnits, setBusinessUnits] = useState<DropdownState>(initialState);
  const [products, setProducts] = useState<DropdownState>(initialState);
  const [users, setUsers] = useState<DropdownState>(initialState);
  const [lossReasons, setLossReasons] = useState<DropdownState>(initialState);
  const [stages, setStages] = useState<DropdownState>(initialState);
  const [contacts, setContacts] = useState<DropdownState>(initialState);



  // Lazy loaders for each dropdown
  const loadOpportunityTypes = useCallback(async () => {
    if (opportunityTypes.isLoaded || opportunityTypes.isLoading) return;

    setOpportunityTypes(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await opportunitiesService.getOpportunityTypes();
      const data = response?.content || response;
      let processedData = [];
      if (data && data.List) {
        processedData = data.List.map((type: any) => ({
          value: type.Name || type.Display || type.Type,
          label: type.Name || type.Display || type.Type,
          id: type.ID || type.Value,
          name: type.Name || type.Display || type.Type
        }));
      }

      setOpportunityTypes({
        data: processedData,
        isLoading: false,
        isLoaded: true,
        error: null
      });
    } catch (error) {
      console.error('Failed to load opportunity types:', error);
      setOpportunityTypes({
        data: [],
        isLoading: false,
        isLoaded: true,
        error: 'Failed to load opportunity types'
      });
    }
  }, [opportunityTypes.isLoaded, opportunityTypes.isLoading]);

  const loadBusinessUnits = useCallback(async () => {
    if (businessUnits.isLoaded || businessUnits.isLoading) return;

    setBusinessUnits(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiService.getBusinessUnits();
      const data = response?.content || response;
      const list = data?.List || data?.list || [];
      let processedData = [];
      if (Array.isArray(list) && list.length > 0) {
        processedData = list.map((unit: any) => ({
          value: unit.Display || unit.Name,
          label: unit.Display || unit.Name,
          id: unit.Value || unit.ID,
          name: unit.Display || unit.Name
        }));
      }

      setBusinessUnits({
        data: processedData,
        isLoading: false,
        isLoaded: true,
        error: null
      });
    } catch (error) {
      console.error('Failed to load business units:', error);
      setBusinessUnits({
        data: [],
        isLoading: false,
        isLoaded: true,
        error: 'Failed to load business units'
      });
    }
  }, [businessUnits.isLoaded, businessUnits.isLoading]);

  const loadProducts = useCallback(async () => {
    if (products.isLoading) return;

    // Build BU IDs string from formData
    const buIds = Array.isArray(formData?.businessUnitId)
      ? formData.businessUnitId.filter(Boolean).join(',')
      : (formData?.businessUnitId || '');

    setProducts(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiService.getProductsByCriteria(buIds);
      const data = response?.content || response;
      const productsList = extractListFromResponse(data);
      let processedData = [];
      if (productsList && productsList.length > 0) {
        processedData = productsList.map((product: any) => ({
          value: product.Display || product.Name,
          label: product.Display || product.Name,
          id: product.Value || product.ID,
          name: product.Display || product.Name
        }));
      }

      setProducts({
        data: processedData,
        isLoading: false,
        isLoaded: true,
        error: null
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts({
        data: [],
        isLoading: false,
        isLoaded: true,
        error: 'Failed to load products'
      });
    }
  }, [products.isLoading, formData?.businessUnitId]);

  const loadUsers = useCallback(async () => {
    if (users.isLoaded || users.isLoading) return;

    setUsers(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiService.getUserAccounts();
      const data = response?.content || response;
      let processedData = [];
      if (data && data.List) {
        processedData = data.List.map((user: any) => ({
          value: user.Display || `${user.FirstName} ${user.LastName}`.trim(),
          label: user.Display || `${user.FirstName} ${user.LastName}`.trim(),
          id: user.Value || user.ID,
          name: user.Display || `${user.FirstName} ${user.LastName}`.trim()
        }));
      }

      setUsers({
        data: processedData,
        isLoading: false,
        isLoaded: true,
        error: null
      });
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers({
        data: [],
        isLoading: false,
        isLoaded: true,
        error: 'Failed to load users'
      });
    }
  }, [users.isLoaded, users.isLoading]);

  const loadLossReasons = useCallback(async () => {
    if (lossReasons.isLoaded || lossReasons.isLoading) return;

    setLossReasons(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await opportunitiesService.getOpportunityLossReasons();
      const data = response?.content || response;
      let processedData = [];
      if (data && data.List) {
        processedData = data.List.map((reason: any) => ({
          value: reason.Name || reason.Display || reason.LossReason,
          label: reason.Name || reason.Display || reason.LossReason,
          id: reason.ID || reason.Value,
          name: reason.Name || reason.Display || reason.LossReason
        }));
      }

      setLossReasons({
        data: processedData,
        isLoading: false,
        isLoaded: true,
        error: null
      });
    } catch (error) {
      console.error('Failed to load loss reasons:', error);
      setLossReasons({
        data: [],
        isLoading: false,
        isLoaded: true,
        error: 'Failed to load loss reasons'
      });
    }
  }, [lossReasons.isLoaded, lossReasons.isLoading]);

  const loadStages = useCallback(async () => {
    if (stages.isLoaded || stages.isLoading) return;

    setStages(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await opportunitiesService.getOpportunityStages();
      const list = response?.content?.List ?? response?.List ?? [];
        if (list) {
         const stages =  list.map((stage: any) => ({
            value: stage.Stage ,
            label: stage.Stage ,
            id: stage.ID ,
            name: stage.Stage ,
            description: stage.Description,
            percentClosed: stage.PercentClosed,
            sortOrder: stage.SortOrder,
            colorCode: stage.ColorCode
          }));
          setStages({
            data: stages,
            isLoading: false,
            isLoaded: true,
            error: null
          });
        }

    
    } catch (error) {
      console.error('Failed to load stages:', error);
      setStages({
        data: [],
        isLoading: false,
        isLoaded: true,
        error: 'Failed to load stages'
      });
    }
  }, [stages.isLoaded, stages.isLoading]);

  const loadContacts = useCallback(async () => {
  if (contacts.isLoading) return;

  const customerId = formData.customerId || formData.contactDetails?.ID;
  if (!customerId) {
    setContacts({
      data: [],
      isLoading: false,
      isLoaded: true,
      error: null,
    });
    return;
  }

  setContacts(prev => ({ ...prev, isLoading: true }));

  try {
    const response = await apiService.getContactNames(customerId);
    const data = response?.content?.List ?? response?.List ?? [];

    const contactsList = data.map((contact: any) => ({
      value: contact.ContactFullName,
      label: contact.ContactFullName,
      id: contact.ID,
      name: contact.ContactFullName,
    }));

    setContacts({
      data: contactsList,
      isLoading: false,
      isLoaded: true,
      error: null,
    });
  } catch (error) {
    console.error("Failed to load contacts:", error);
    setContacts({
      data: [],
      isLoading: false,
      isLoaded: true,
      error: "Failed to load contacts",
    });
  }
}, [contacts.isLoading, formData.customerId, formData.contactDetails?.ID]);

  // Reset products when business units change
  const resetProducts = useCallback(() => {
    setProducts(initialState);
  }, []);

  // Reset contacts when customer changes
  const resetContacts = useCallback(() => {
    setContacts(initialState);
  }, []);

  // Preload data in edit mode when values exist
  useEffect(() => {
    if (!isEditMode) return;

    // Load opportunity types if value exists
    if (formData.opportunityType?.id && !opportunityTypes.isLoaded && !opportunityTypes.isLoading) {
      loadOpportunityTypes();
    }

    // Load stages if value exists
    if ((formData.stage || formData.stageDetails?.ID) && !stages.isLoaded && !stages.isLoading) {
      loadStages();
    }

    // Load business units if values exist
    if (formData.businessUnitId?.length > 0 && !businessUnits.isLoaded && !businessUnits.isLoading) {
      loadBusinessUnits();
    }

    // Load products if values exist
    if (formData.productId?.length > 0 && !products.isLoaded && !products.isLoading) {
      loadProducts();
    }

    // Load users if assigned rep or sales presenter exists
    if ((formData.assignedRepDetails?.ID || formData.salesPresenterDetails?.ID) && !users.isLoaded && !users.isLoading) {
      loadUsers();
    }

    // Load loss reasons if value exists
    if ((formData.lostReason || formData.lossReasonDetails?.ID) && !lossReasons.isLoaded && !lossReasons.isLoading) {
      loadLossReasons();
    }

    // Load contacts if customer and contact exist
    if ((formData.customerId || formData.contactDetails?.ID) && formData.contactName && !contacts.isLoaded && !contacts.isLoading) {
      loadContacts();
    }
  }, [
    isEditMode,
    formData.opportunityType?.id,
    formData.stage,
    formData.stageDetails?.ID,
    formData.businessUnitId,
    formData.productId,
    formData.assignedRepDetails?.ID,
    formData.salesPresenterDetails?.ID,
    formData.lostReason,
    formData.lossReasonDetails?.ID,
    formData.customerId,
    formData.contactDetails?.ID,
    formData.contactName,
    opportunityTypes.isLoaded,
    opportunityTypes.isLoading,
    stages.isLoaded,
    stages.isLoading,
    businessUnits.isLoaded,
    businessUnits.isLoading,
    products.isLoaded,
    products.isLoading,
    users.isLoaded,
    users.isLoading,
    lossReasons.isLoaded,
    lossReasons.isLoading,
    contacts.isLoaded,
    contacts.isLoading,
    loadOpportunityTypes,
    loadStages,
    loadBusinessUnits,
    loadProducts,
    loadUsers,
    loadLossReasons,
    loadContacts
  ]);

  return {
    // Data and states
    opportunityTypes: opportunityTypes.data,
    isLoadingOpportunityTypes: opportunityTypes.isLoading,
    
    businessUnits: businessUnits.data,
    isLoadingBusinessUnits: businessUnits.isLoading,
    
    products: products.data,
    isLoadingProducts: products.isLoading,
    
    users: users.data,
    isLoadingUsers: users.isLoading,
    
    lossReasons: lossReasons.data,
    isLoadingLossReasons: lossReasons.isLoading,
    
    stages: stages.data,
    isLoadingStages: stages.isLoading,
    
    contacts: contacts.data,
    isLoadingContacts: contacts.isLoading,

    // Lazy loaders (call these on dropdown open/focus)
    loadOpportunityTypes,
    loadBusinessUnits,
    loadProducts,
    loadUsers,
    loadLossReasons,
    loadStages,
    loadContacts,

    // Reset functions
    resetProducts,
    resetContacts
  };
};