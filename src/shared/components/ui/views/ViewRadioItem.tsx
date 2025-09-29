import React, { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
// Radio button component for view selection
import { 
  Edit, 
  Copy, 
  Trash2, 
  Check, 
  X,
  Lock,
  Loader2
} from 'lucide-react'
import { SavedView } from '@/shared/types/views'

interface ViewRadioItemProps {
  view: SavedView
  isSelected: boolean
  isGlobal: boolean
  isLoading?: boolean
  name: string
  onSelect: () => void
  onUpdate: (updates: Partial<SavedView>) => void
  onDelete: () => void
  onCopy: (view: SavedView) => void
  onEdit: (view: SavedView) => void
}

const ViewRadioItem: React.FC<ViewRadioItemProps> = ({
  view,
  isSelected,
  isGlobal,
  isLoading = false,
  name,
  onSelect,
  onUpdate,
  onDelete,
  onCopy,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(view.name)

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== view.name) {
      onUpdate({ name: editName.trim() })
    }
    setIsEditing(false)
    setEditName(view.name)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(view.name)
  }

  const handleCopy = () => {
    onCopy(view)
  }

  return (
    <div 
      className={`
        relative flex items-center gap-2 py-1 px-1 transition-all duration-150 cursor-pointer
        ${isSelected 
          ? 'bg-gray-50' 
          : 'hover:bg-gray-25'
        }
        ${isLoading ? 'opacity-75' : ''}
      `}
      onClick={!isSelected ? onSelect : undefined}
    >
      {/* Radio Button */}
      <div className="flex-shrink-0">
        <input
          type="radio"
          name={name}
          checked={isSelected}
          onChange={onSelect}
          className="h-3 w-3 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-1"
          aria-describedby={`${view.id}-description`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-7 text-sm flex-1"
              placeholder="View name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
            />
            <Button
              size="sm"
              onClick={handleSaveEdit}
              className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600"
              disabled={!editName.trim()}
            >
              <Check className="h-3 w-3 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate text-gray-900">
                {view.name}
              </h4>
              <span className="text-[11px] text-gray-500">
                ({view.columns.length})
              </span>
              <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                {isGlobal && (
                  <Lock className="h-3 w-3 text-blue-500" />
                )}
                {view.isDefault && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3 bg-green-100 text-green-700 border-green-200">
                    Default
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Loading indicator */}
        {isLoading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        )}

        {/* Edit (Personal views only) */}
        {!isGlobal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(view)
            }}
            className="h-5 w-5 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-sm"
            title="Edit view columns"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}

        {/* Copy */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          className="h-5 w-5 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-sm"
          title="Copy view"
        >
          <Copy className="h-3 w-3" />
        </Button>

        {/* Delete (Personal views only) */}
        {!isGlobal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="h-5 w-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-sm"
            title="Delete view"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default ViewRadioItem