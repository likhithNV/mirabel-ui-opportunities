import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

import { toast } from '@/features/Opportunity/hooks/use-toast';
import { GradientTabBar, TabItem } from '@/shared/components/ui/GradientTabBar';
import EditOpportunityHeader from './EditOpportunityHeader';
import OpportunityInfoTab from './tabs/OpportunityInfoTab';
import LinkedProposalsTab from './tabs/LinkedProposalsTab';
import TasksTab from './tabs/TasksTab';
import ActivitiesTab from './tabs/ActivitiesTab';
import StageProgressionTab from './tabs/StageProgressionTab';

import StatusChangeConfirmDialog from './StatusChangeConfirmDialog';
import Loader from '@/components/ui/loader';
import { useOpportunityForm } from '../../hooks/useOpportunityForm';
import OpportunityStatsSection from './tabs/OpportunityStatsSection';

type EditOpportunityProps = {
    overrideId?: string;
};

const EditOpportunity: React.FC<EditOpportunityProps> = ({ overrideId }) => {
    const routeParams = useParams<{ id: string }>();
    const id = overrideId ?? routeParams.id;
    const navigate = useNavigate();

    const isAddMode = !id || id === '0';
    const [activeTab, setActiveTab] = useState('opportunity-info');

    const {
        formData,
        handleInputChange,
        handleBatchInputChange,
        isLoading,
        isSaving,
        saveOpportunity,
        unlinkProposal,
        shouldShowUnlinkOption,
        isProposalReplacement,
        originalProposalId,
        getFieldError,
        hasSubmitted,
        statusConfirmDialog,
        handleStatusConfirm,
        handleStatusCancel,
        hasValidationErrors
    } = useOpportunityForm(id);

    const handleSave = async () => {
        console.log('HandleSave: Save button clicked');
        try {
            const success = await saveOpportunity();
            console.log('HandleSave: Save result:', success);
            
            if (success) {
                console.log('HandleSave: Save successful, showing success toast and navigating');
                toast({
                    title: "Success!",
                    description: `The opportunity has been successfully ${isAddMode ? 'created' : 'updated'}.`,
                    className: 'border-green-200 bg-green-50 text-green-900 shadow-lg',
                    duration: 4000,
                });
                navigate('/opportunities');
            } else {
                console.log('HandleSave: Save failed');
            }
        } catch (error) {
            console.error('HandleSave: Unexpected error:', error);
        }
    };

    const handleCancel = () => {
        navigate('/opportunities');
    };

    const tabs: TabItem[] = isAddMode ? [
        {
            id: 'opportunity-info',
            label: 'Opportunity Information'
        },
        {
            id: 'linked-proposals',
            label: 'Proposals'
        }
    ] : [
        {
            id: 'opportunity-info',
            label: 'Opportunity Information'
        },
        {
            id: 'linked-proposals',
            label: 'Linked Proposals'
        },
        {
            id: 'tasks',
            label: 'Tasks'
        },
        {
            id: 'activities',
            label: 'Activities'
        },
        {
            id: 'stage-progression',
            label: 'Stage Progression'
        },
        {
            id: 'stats',
            label: 'Stats'
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'opportunity-info':
                return (
                    <OpportunityInfoTab
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleBatchInputChange={handleBatchInputChange}
                        getFieldError={getFieldError}
                        hasSubmitted={hasSubmitted}
                        isAddMode={isAddMode}
                    />
                );
            case 'linked-proposals':
                return (
                    <LinkedProposalsTab
                        formData={formData}
                        handleBatchInputChange={handleBatchInputChange}
                        opportunityId={id}
                        onUnlinkProposal={unlinkProposal}
                        shouldShowUnlinkOption={shouldShowUnlinkOption}
                        isProposalReplacement={isProposalReplacement}
                        originalProposalId={originalProposalId}
                    />
                );
            case 'tasks':
                return (
                    <TasksTab
                        companyId={formData.contactDetails?.ID?.toString()}
                        opportunityId={id}
                    />
                );
            case 'activities':
                return (
                    <ActivitiesTab
                        opportunityId={id}
                    />
                );
            case 'stage-progression':
                return (
                    <StageProgressionTab
                        formData={formData}
                        handleInputChange={handleInputChange}
                        opportunityId={id}
                    />
                );
            case 'stats':
                return (
                    <OpportunityStatsSection
                        opportunityId={id}
                    />
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col bg-gray-50 w-full min-h-screen">
                <div className="flex-1 flex items-center justify-center">
                    <Loader size="lg" text="Loading opportunity details..." />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-gray-50 w-full min-h-screen">
            <EditOpportunityHeader
                opportunityId={id}
                onCancel={handleCancel}
                onSave={handleSave}
                isSaving={isSaving}
                isAddMode={isAddMode}
                formData={formData}
                hasValidationErrors={hasValidationErrors}
            />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-blue-800">
                                {isAddMode ? 'Add New Opportunity' : 'Opportunity Details'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Show Proposal Information if linked */}
                            {!isAddMode && formData?.proposalName && (
                                <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-blue-700 font-medium">
                                            Linked Proposal:
                                        </span>
                                        <a
                                            href={`/proposals/${formData.proposalId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            {formData.proposalName}
                                        </a>
                                        {isProposalReplacement(formData.proposalId) && (
                                            <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                                                (New Selection - Save to Confirm)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
               <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <GradientTabBar
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        variant="default"
                        />
                    </div>

              </div>                 

                            {/* Tab Content */}
                            <div className="mt-6">
                                {renderTabContent()}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Status Change Confirmation Dialog */}
            <StatusChangeConfirmDialog
                isOpen={statusConfirmDialog.isOpen}
                onOpenChange={(open: boolean) => !open && handleStatusCancel()}
                statusValue={statusConfirmDialog.newStatus}
                onConfirm={handleStatusConfirm}
                onCancel={handleStatusCancel}
            />
        </div>
    );
};

export default EditOpportunity;