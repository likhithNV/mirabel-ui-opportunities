import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Calendar, DollarSign, User, Building2, Edit } from "lucide-react";
import TableFilterControls from "@/features/Opportunity/components/table/TableFilterControls";
import TableBadge from "../../ui/TableBadge";

/**
 * CardViewNew - Opportunities Card View with Filter Controls on top
 *
 * Reusable, responsive card view that renders filter controls at the top
 * and a grid of opportunity cards below. All data and handlers are provided
 * via props to keep the component decoupled.
 */
const CardViewNew = ({
  opportunities = [],
  // filter controls props
  view,
  onViewChange,
  filters,
  onFilterChange,
  users,
  savedSearches,
  sortConfig,
  onSort,
  onRefresh,
  currentPage,
  onNextPage,
  onPreviousPage,
  totalCount,
  // card interactions
  onCardClick,
  onEditOpportunity,
}) => {
  const totalItems = typeof totalCount === "number" ? totalCount : opportunities.length;

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm" style={{ height: '410px' }}>
      {/* Filter Controls (Top bar) */}
      {/* <TableFilterControls
        filters={filters}
        onFilterChange={onFilterChange}
        totalItems={totalItems}
        view={view}
        onViewChange={onViewChange}
        users={users}
        savedSearches={savedSearches}
        sortConfig={sortConfig}
        onSort={onSort}
        onRefresh={onRefresh}
        currentPage={currentPage}
        onNextPage={onNextPage}
        onPreviousPage={onPreviousPage}
        totalCount={totalCount}
      /> */}

      {/* Cards Grid */}
      <div className="p-4 bg-neutral-50" style={{ height: 'inherit' , overflow: 'auto'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {opportunities.map((opportunity) => (
            <OpportunityItemCard
              key={opportunity.id ?? opportunity.ID}
              opportunity={opportunity}
              onClick={onCardClick}
              onEdit={onEditOpportunity}
            />)
          )}
        </div>

        {opportunities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No opportunities match the current filters
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">Showing {totalItems} opportunities</div>
      </div>
    </div>
  );
};

/**
 * Single card renderer. Kept local to this file for cohesion.
 */
const OpportunityItemCard = ({ opportunity, onClick, onEdit }) => {
  const navigate = useNavigate();

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || amount === "") return "0";
    let str = String(amount).replace(/[$,\s]/g, "").trim();
    const num = parseFloat(str);
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  const handleCardDoubleClick = () => {
    // Fallback: try navigate to an edit route if available in the app
    if (opportunity?.id || opportunity?.ID) {
      try {
        const id = opportunity?.id ?? opportunity?.ID;
        navigate(`/edit-opportunity-new/${id}`);
      } catch (_) {
        /* navigation optional */
      }
    }
  };

  const handleEdit = (e) => {
    e?.stopPropagation?.();
    const id = opportunity?.id ?? opportunity?.ID;
    if (id) {
      try {
        navigate(`/edit-opportunity-new/${id}`);
      } catch (_) { /* no-op */ }
    }
  };

  const amountValue = formatAmount(opportunity?.amount ?? opportunity?.Amount);
  const probability = opportunity?.probability ?? opportunity?.Probability;
  const stage = opportunity?.OppStageDetails ? opportunity?.OppStageDetails.Stage : opportunity?.stage ?? opportunity?.Stage ?? "";
  const status = opportunity?.status ?? opportunity?.Status ?? "";
  const companyName = opportunity?.companyName ?? opportunity?.CompanyName ?? opportunity?.company ?? opportunity?.Customer;
  const title = opportunity?.opportunityName ?? opportunity?.name ?? opportunity?.OpportunityName ?? opportunity?.Name ?? "";
  const rep = opportunity?.assignedRep?.name ?? opportunity?.AssignedTo ?? "";
  const closeDate = opportunity?.projCloseDate ?? opportunity?.CloseDate ?? "";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 flex flex-col h-full"
      onDoubleClick={handleCardDoubleClick}
      onClick={() => onClick && onClick(opportunity)}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-blue-800 min-h-[2.5rem] flex items-start">
            <div className="line-clamp-2">{title}</div>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-6 w-6 flex-shrink-0"
            title="Edit opportunity"
          >
            <Edit className="h-3 w-3 text-gray-500 hover:text-blue-600" />
          </Button>
        </div>
        {companyName && (
          <div className="flex items-center gap-2 h-5">
            <Building2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 font-medium truncate">{companyName}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {/* Amount */}
          <div className="flex items-center gap-2 h-6">
            <DollarSign className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-lg font-bold text-emerald-600">{amountValue}</span>
          </div>

          {/* Assigned Rep */}
          {rep && (
            <div className="flex items-center gap-2 h-6">
              <User className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">{rep}</span>
            </div>
          )}

          {/* Close Date */}
          {closeDate && (
            <div className="flex items-center gap-2 h-6">
              <Calendar className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="text-sm text-gray-600">{closeDate}</span>
            </div>
          )}
        </div>

        {/* Bottom fixed section */}
        <div className="mt-3 pt-2">
          <div className="flex justify-between items-center min-h-[24px]">
            {stage && (
              <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-700">
                {stage}
              </Badge>
            )}
            {status && <TableBadge  status={status} />}
          </div>

          <div className="h-5 mt-2">
            <div className="text-xs text-gray-500">
              <span className="text-cyan-600 font-medium">{`${probability>0 && String(probability) !== "0" ? probability : 0}%`}</span> probability
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

CardViewNew.propTypes = {
  opportunities: PropTypes.arrayOf(PropTypes.object),
  view: PropTypes.any,
  onViewChange: PropTypes.func,
  filters: PropTypes.object,
  onFilterChange: PropTypes.func,
  users: PropTypes.array,
  savedSearches: PropTypes.array,
  sortConfig: PropTypes.object,
  onSort: PropTypes.func,
  onRefresh: PropTypes.func,
  currentPage: PropTypes.number,
  onNextPage: PropTypes.func,
  onPreviousPage: PropTypes.func,
  totalCount: PropTypes.number,
  onCardClick: PropTypes.func,
  onEditOpportunity: PropTypes.func,
};

OpportunityItemCard.propTypes = {
  opportunity: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
};

export default CardViewNew;

/**
 * Example usage:
 *
 * <CardViewNew
 *   opportunities={data}
 *   view={view}
 *   onViewChange={setView}
 *   filters={filters}
 *   onFilterChange={setFilters}
 *   users={users}
 *   onRefresh={refetch}
 *   onCardClick={(opp) => console.log('Clicked', opp)}
 * />
 */


