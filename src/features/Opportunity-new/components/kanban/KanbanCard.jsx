import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Calendar,
  DollarSign,
  User,
  Building2,
  Edit,
  Trash2,
} from "lucide-react";
import { getDragId } from "../../utils/kanbanUtils";
import { useNavigate } from "react-router-dom";

const KanbanCard = ({
  opportunity,
  index,
  isUpdating = false,
  onDeleteOpportunity,
  onEditOpportunity,
  stageColor,
}) => {
  const navigate = useNavigate();
  const readPath = (obj, path) => {
    try {
      return path.split('.').reduce((acc, key) => acc?.[key], obj);
    } catch { return undefined; }
  };

  const coalesce = (...vals) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== "");

  const formatDateForDisplay = (value) => {
    if (!value) return "";
    try {
      // If already like MM/DD/YYYY, return as-is
      if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value.trim())) {
        return value;
      }
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch {
      return String(value);
    }
  };

  const handleEditOpportunity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e && e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
      e.nativeEvent.stopImmediatePropagation();
    }

    const opportunityId = opportunity.id || opportunity.ID;
    if (onEditOpportunity) {
      onEditOpportunity(opportunityId);
    } else if (opportunityId) {
      navigate(`/edit-opportunity-new/${opportunityId}`);
    }
  };

  const handleDeleteOpportunity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const opportunityId = opportunity.id || opportunity.ID;
    const opportunityName = opportunity.opportunityName || opportunity.name;

    if (
      window.confirm(
        `Are you sure you want to delete opportunity "${opportunityName}"? This action cannot be undone.`
      )
    ) {
      onDeleteOpportunity(opportunityId);
    }
  };

  const getStatusVariant = (status) => {
    if (!status) return "default";

    switch (status.toLowerCase()) {
      case "open":
        return "open";
      case "won":
        return "won";
      case "lost":
        return "lost";
      default:
        return "default";
    }
  };

  const draggableId = getDragId(opportunity, index);

  if (!draggableId) {
    return null;
  }

  const title = coalesce(
    opportunity.opportunityName,
    opportunity.name,
    opportunity.Name,
    readPath(opportunity, 'Proposal.Name')
  );

  const company = coalesce(
    opportunity.companyName,
    opportunity.company,
    readPath(opportunity, 'ContactDetails.Name'),
    opportunity.CustomerName
  );

  const assigned = coalesce(
    opportunity.assignedRep,
    opportunity.assignedTo,
    readPath(opportunity, 'AssignedTODetails.Name'),
    readPath(opportunity, 'OwnerDetails.Name'),
    readPath(opportunity, 'SalesPresenterDetails.SalesRepName')
  );

  const closeDate = coalesce(
    opportunity.projCloseDate,
    opportunity.closeDate,
    opportunity.CloseDate,
    readPath(opportunity, 'Proposal.CloseDate')
  );

  const status = coalesce(
    opportunity.status,
    opportunity.Status,
    readPath(opportunity, 'Proposal.Status')
  );

  // Compute subtle background from stageColor
  const color = stageColor || '#e5e7eb';
  const hex = String(color).replace('#','');
  const r = parseInt(hex.substring(0,2), 16);
  const g = parseInt(hex.substring(2,4), 16);
  const b = parseInt(hex.substring(4,6), 16);
  const bgTint = `rgba(${isNaN(r)?229:r}, ${isNaN(g)?231:g}, ${isNaN(b)?235:b}, 0.12)`;
  const borderTint = stageColor || '#e5e7eb';

  return (
    <Draggable
      draggableId={draggableId}
      index={index}
      isDragDisabled={isUpdating}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 cursor-grab active:cursor-grabbing ${
            snapshot.isDragging ? "opacity-50" : ""
          }`}
          style={{
            ...provided.draggableProps.style,
          }}
          title="Drag to move this opportunity"
        >
          <Card
            className={`hover:shadow-md transition-shadow border ${
              isUpdating ? "opacity-75" : ""
            }`}
            style={{
              borderColor: '#e5e7eb',
              background: bgTint,
              boxShadow: 'inset 4px 0 0 0 ' + borderTint,
            }}
          >
            <CardHeader className="pb-1 p-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight flex-1" title={String(title || '')}>
                  {title}
                </CardTitle>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditOpportunity}
                    className="h-5 w-5"
                    disabled={isUpdating}
                    title="Edit opportunity"
                  >
                    <Edit className="h-3 w-3 text-gray-500 hover:text-blue-600" />
                  </Button>
                  {onDeleteOpportunity && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteOpportunity}
                      className="h-5 w-5"
                      disabled={isUpdating}
                      title="Delete opportunity"
                    >
                      <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Building2 className="h-3 w-3 text-indigo-500" />
                <span className="text-xs text-gray-600 font-medium" title={String(company || '')}>
                  {company}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0 px-2 pb-1.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">
                  {(() => {
                    const raw = opportunity.amount ?? opportunity.Amount ?? 0;
                    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
                    const safe = isNaN(num) ? 0 : num;
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(safe);
                  })()}
                </span>
              </div>

              <div className="flex items-center gap-1" title={String(assigned || '')}>
                <User className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-gray-600">
                  {assigned}
                </span>
              </div>

              <div className="flex items-center gap-1" title={String(closeDate || '')}>
                <Calendar className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-gray-600">
                  {formatDateForDisplay(closeDate)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <Badge
                  variant={getStatusVariant(status)}
                  className="text-xs"
                >
                  {status}
                </Badge>
                <span className="text-xs text-gray-400">#{draggableId}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;