export interface SavedView {
  id: string
  name: string
  description?: string
  columns: string[]
  isDefault?: boolean
  isGlobal?: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface ColumnDefinition {
  key: string
  title: string
  width?: number
  locked?: boolean
  sortable?: boolean
  resizable?: boolean
  category?: string
  description?: string
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'custom'
  required?: boolean
  usage?: {
    frequency: number
    lastUsed: Date
    importance: 'high' | 'medium' | 'low'
  }
}

export interface ViewsSidebarProps {
  columns: ColumnDefinition[]
  visibleColumns: ColumnDefinition[]
  savedViews: SavedView[]
  activeView: SavedView | null
  isOpen: boolean
  onClose: () => void
  onToggleColumn: (columnKey: string) => void
  onReorderColumns?: (columnKeys: string[]) => void
  onLoadView: (viewId: string) => void
  onSaveView: (name: string, description?: string) => SavedView
  onUpdateView: (viewId: string, updates: Partial<SavedView>) => void
  onDeleteView: (viewId: string) => void
  onResetToDefault: () => void
}