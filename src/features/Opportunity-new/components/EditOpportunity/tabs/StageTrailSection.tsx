
import React, { useState, useEffect } from "react";
import TimelineContainer from "./StageTrail/TimelineContainer";
import EmptyStageTrail from "./StageTrail/EmptyStageTrail";
import { opportunitiesService } from "@/features/Opportunity/Services/opportunitiesService";

/**
 * StageTrailSection Component
 * 
 * Displays the complete stage progression timeline for an opportunity.
 * Shows all stage changes in chronological order with timestamps and user information.
 * Provides visual feedback when no stage changes have occurred yet.
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.opportunityId - Unique identifier for the opportunity
 * 
 * @returns {JSX.Element} Stage trail section with timeline or empty state
 * 
 * @example
 * <StageTrailSection opportunityId="OPP-001" />
 * 
 * @description
 * This component fetches stage change data from the opportunity history API
 * and filters for stage-related changes only. It transforms the API data
 * into the format expected by the TimelineContainer component.
 */
const StageTrailSection = ({ opportunityId }) => {
  const [stageChanges, setStageChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStageChanges = async () => {
      if (!opportunityId) {
        setStageChanges([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('StageTrailSection: Fetching stage changes for opportunity ID:', opportunityId);
        
        const response = await opportunitiesService.getOpportunityHistory(opportunityId);
        console.log('StageTrailSection: History response:', response);
        
        if (response && response.content && response.content.Data && response.content.Data.Audit) {
          const auditData = response.content.Data.Audit;
          
          // Filter for stage-related changes only
          const stageAuditData = auditData.filter(item => 
            item.FieldName && item.FieldName.toLowerCase().includes('stage')
          );
          
          console.log('StageTrailSection: Filtered stage audit data:', stageAuditData);
          
          // Transform API data to match the expected format for TimelineContainer
          const transformedStageChanges = stageAuditData.map((item, index) => {
            // Parse the date to get a proper Date object
            const changeDate = new Date(item.UpdatedOn);
            
            return {
              id: `stage-${opportunityId}-${index}`,
              date: item.UpdatedOn,
              fromStage: item.FieldValueOld || 'Unknown',
              toStage: item.FieldValueNew || 'Unknown',
              user: item.UpdatedBy || 'System',
              timestamp: changeDate.getTime(), // For sorting
              description: `Stage changed from "${item.FieldValueOld || 'Unknown'}" to "${item.FieldValueNew || 'Unknown'}"`,
              // Additional fields that TimelineContainer might expect
              stageName: item.FieldValueNew || 'Unknown',
              previousStage: item.FieldValueOld || 'Unknown',
              updatedBy: item.UpdatedBy || 'System',
              updatedOn: item.UpdatedOn
            };
          });
          
          // Sort by date (newest first)
          const sortedStageChanges = transformedStageChanges.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          
          console.log('StageTrailSection: Transformed stage changes:', sortedStageChanges);
          setStageChanges(sortedStageChanges);
        } else {
          console.log('StageTrailSection: No audit data found in response');
          setStageChanges([]);
        }
      } catch (error) {
        console.error('StageTrailSection: Failed to fetch stage changes:', error);
        setError('Failed to load stage progression data');
        setStageChanges([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStageChanges();
  }, [opportunityId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Stage Progression Timeline</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-gray-500">Loading stage progression...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Stage Progression Timeline</h3>
        </div>
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <p className="text-sm mt-2">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header with stage change count */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Stage Progression Timeline</h3>
        <div className="text-sm text-gray-500">
          {stageChanges.length} stage changes
        </div>
      </div>

      {/* Conditional rendering based on stage change availability */}
      {stageChanges.length > 0 ? (
        <TimelineContainer stageChanges={stageChanges} />
      ) : (
        <EmptyStageTrail />
      )}
    </div>
  );
};

export default StageTrailSection;
