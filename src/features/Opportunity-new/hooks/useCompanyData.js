import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../services/apiService";

export const useCompanyData = (selectedCompany, selectedCompanyData) => {
    const queryClient = useQueryClient();

    // Extract contact ID from the selected company data
    const contactId = selectedCompanyData?.contactId ||
        selectedCompanyData?.ContactDetails?.ID ||
        selectedCompanyData?.gsCustomersID ||
        selectedCompanyData?.ContactID ||
        selectedCompanyData?.ID;

    console.log('useCompanyData: Contact ID extraction:', {
        selectedCompanyData,
        contactId,
        extractedFrom: {
            contactId: selectedCompanyData?.contactId,
            ContactDetailsID: selectedCompanyData?.ContactDetails?.ID,
            gsCustomersID: selectedCompanyData?.gsCustomersID,
            ContactID: selectedCompanyData?.ContactID,
            ID: selectedCompanyData?.ID
        }
    });

    // Fetch company details from API
    const { data: apiCompanyData, isLoading, error, refetch } = useQuery({
        queryKey: ['companyDetails', contactId],
        queryFn: () => apiService.getCompanyDetails(contactId),
        enabled: !!contactId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    // State for company data - initialize with empty/null values
    const [companyData, setCompanyData] = useState({
        name: selectedCompany || "",
        firstName: "",
        lastName: "",
        phone: "",
        ext: "",
        mobile: "",
        email: "",
        address: "",
        website: "",
        industry: "",
        employees: ""
    });

    // Update company data when API data is received or selectedCompany changes
    useEffect(() => {
        console.log('useCompanyData: selectedCompany changed:', selectedCompany);
        console.log('useCompanyData: selectedCompanyData:', selectedCompanyData);
        console.log('useCompanyData: contactId:', contactId);
        console.log('useCompanyData: apiCompanyData:', apiCompanyData);

        if (apiCompanyData?.data?.content?.Data) {
            // Parse API response and update company data - only use API data
            const apiData = apiCompanyData.data.content.Data;
            console.log('useCompanyData: Processing API data:', apiData);

            // Extract contact details from the correct nested structure
            const contactDetails = apiData.ContactDetails || {};
            console.log('useCompanyData: Extracted ContactDetails:', contactDetails);

            setCompanyData({
                name: selectedCompany || contactDetails.Name || "",
                firstName: contactDetails.FirstName || "",
                lastName: contactDetails.LastName || "",
                phone: contactDetails.Phone || "",
                ext: contactDetails.PhoneExt || "",
                mobile: contactDetails.CellPhone || "",
                email: contactDetails.Email || "",
                address: `${contactDetails?.AddressDetails?.Address1 || ""} ${contactDetails?.AddressDetails?.City || ""} ${contactDetails?.AddressDetails?.State || ""}`.trim(),
                website: contactDetails.URL || contactDetails.BaseUrl || "",
                industry: contactDetails.Industry || "",
                employees: contactDetails.Employees || ""
            });
        } else if (selectedCompany) {
            // Fallback: only update company name and any real data from selectedCompanyData
            console.log('useCompanyData: Using only real data for company:', selectedCompany);
            setCompanyData(prev => ({
                ...prev,
                name: selectedCompany,
                // Only update with real data from selectedCompanyData if available
                firstName: selectedCompanyData?.contactName?.split(' ')[0] || "",
                lastName: selectedCompanyData?.contactName?.split(' ').slice(1).join(' ') || "",
                email: selectedCompanyData?.email || "",
                phone: selectedCompanyData?.phone || "",
            }));
        }
    }, [selectedCompany, selectedCompanyData, apiCompanyData, contactId]);

    // Track which field is being edited
    const [editingField, setEditingField] = useState(null);

    // Store temporary values during editing
    const [tempValue, setTempValue] = useState("");
    const [tempExt, setTempExt] = useState("");
    const [tempFirstName, setTempFirstName] = useState("");
    const [tempLastName, setTempLastName] = useState("");

    // Mutation for updating contact details
    const updateContactMutation = useMutation({
        mutationFn: (updatePayload) => apiService.updateContact(updatePayload),
        onSuccess: () => {
            // Invalidate and refetch company details after successful update
            queryClient.invalidateQueries(['companyDetails', contactId]);
        },
        onError: (error) => {
            console.error('Failed to update contact:', error);
        }
    });

    // Begin editing a field
    const startEditing = (field, value) => {
        setEditingField(field);
        setTempValue(value);

        // For phone field, also set the extension temp value
        if (field === 'phone') {
            setTempExt(companyData.ext || "");
        }
        // For name field, set the first and last name temp values
        else if (field === 'name') {
            setTempFirstName(companyData.firstName || "");
            setTempLastName(companyData.lastName || "");
        }
    };

    // Helper function to create API payload
    const createUpdatePayload = (fieldName, fieldValue, oldValue) => {
        return {
            fieldName,
            fieldValue,
            ID: contactId,
            IsEmailIDVerificationEnabled: true,
            IsSubContactUpdate: false,
            oldValue,
            isArchive: false,
            copyContact: false,
            IsPartial: false,
            SelectedContacts: ""
        };
    };

    // Save the edited value
    const saveEdit = async (field) => {
        console.log('saveEdit called:', {
            field,
            contactId,
            tempValue,
            tempExt,
            tempFirstName,
            tempLastName,
            selectedCompanyData
        });

        if (!contactId) {
            console.error('No contact ID available for update');
            setEditingField(null);
            return;
        }

        let updateData = { [field]: tempValue };
        const apiCalls = [];

        // Special handling for phone field - use separate phone and extension values
        if (field === 'phone') {
            updateData = {
                phone: tempValue,
                ext: tempExt
            };

            // Create API calls for phone update
            if (tempValue !== companyData.phone) {
                apiCalls.push(createUpdatePayload('Phone', tempValue, companyData.phone));
            }
            if (tempExt !== companyData.ext) {
                apiCalls.push(createUpdatePayload('Phonextn', tempExt, companyData.ext));
            }
        }
        // Special handling for name field - update firstName and lastName
        else if (field === 'name') {
            const newFirstName = tempFirstName.trim();
            const newLastName = tempLastName.trim();

            updateData = {
                firstName: newFirstName,
                lastName: newLastName
            };

            // Create API calls for name updates
            if (newFirstName !== companyData.firstName) {
                apiCalls.push(createUpdatePayload('FirstName', newFirstName, companyData.firstName));
            }
            if (newLastName !== companyData.lastName) {
                apiCalls.push(createUpdatePayload('LastName', newLastName, companyData.lastName));
            }
        }
        // Handle other fields
        else if (field === 'email' && tempValue !== companyData.email) {
            apiCalls.push(createUpdatePayload('Email', tempValue, companyData.email));
        }
        else if (field === 'mobile' && tempValue !== companyData.mobile) {
            apiCalls.push(createUpdatePayload('Phone2', tempValue, companyData.mobile));
        }

        // Update local state immediately for better UX
        setCompanyData(prev => ({
            ...prev,
            ...updateData
        }));
        setEditingField(null);

        // Make API calls if there are changes
        if (apiCalls.length > 0) {
            try {
                // Execute all API calls
                await Promise.all(apiCalls.map(payload => updateContactMutation.mutateAsync(payload)));
                console.log('Contact updates successful');
            } catch (error) {
                console.error('Failed to update contact:', error);
                // Optionally revert local changes on error
                // You could implement error handling UI here
            }
        }
    };

    // Cancel editing and revert to original value
    const cancelEdit = () => {
        setEditingField(null);
    };

    // Handle key press events for input fields
    const handleKeyDown = (e, field) => {
        if (e.key === "Enter") {
            saveEdit(field);
        } else if (e.key === "Escape") {
            cancelEdit();
        }
    };

    return {
        companyData,
        setCompanyData,
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
        cancelEdit,
        handleKeyDown,
        isLoading,
        error,
        refetch
    };
};
