// TODO: Replace with real Supabase integration when available
// For now, using mock data to demonstrate functionality

class ReportsViewsService {
    constructor() {
      this.storageKey = 'reports_views';
      this.mockViews = this.loadViewsFromStorage();
    }
  
    loadViewsFromStorage() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading views from storage:', error);
      }
      
      // Return default views if none stored
      return [
        {
          id: '1',
          name: 'Product Performance View',
          visible_columns: ['product', 'opportunities', 'revenue', 'winRate', 'avgDealSize'],
          view_type: 'global',
          page_type: 'reports',
          is_default: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'Business Unit Summary',
          visible_columns: ['businessUnit', 'opportunities', 'revenue', 'winRate'],
          view_type: 'global',
          page_type: 'reports',
          is_default: false,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Lead Source Analysis', 
          visible_columns: ['leadSource', 'opportunities', 'revenue', 'winRate', 'conversionRate'],
          view_type: 'global',
          page_type: 'reports', 
          is_default: false,
          created_at: new Date().toISOString()
        }
      ];
    }
  
    saveViewsToStorage() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.mockViews));
      } catch (error) {
        console.error('Error saving views to storage:', error);
      }
    }
  
    async getViews(pageType = 'reports') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filteredViews = this.mockViews.filter(view => view.page_type === pageType);
      return { success: true, data: filteredViews };
    }
  
    async createView(viewData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newView = {
        id: Date.now().toString(),
        name: viewData.name,
        visible_columns: viewData.visibleColumns,
        view_type: viewData.viewType || 'personal',
        page_type: viewData.pageType || 'reports',
        is_default: false,
        created_at: new Date().toISOString()
      };
      
      this.mockViews.push(newView);
      this.saveViewsToStorage(); // Persist to localStorage
      return { success: true, data: newView };
    }
  
    async updateView(viewId, viewData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const viewIndex = this.mockViews.findIndex(view => view.id === viewId);
      if (viewIndex === -1) {
        return { success: false, error: 'View not found' };
      }
      
      this.mockViews[viewIndex] = {
        ...this.mockViews[viewIndex],
        name: viewData.name,
        visible_columns: viewData.visibleColumns,
        view_type: viewData.viewType,
        is_default: viewData.isDefault || false,
        updated_at: new Date().toISOString()
      };
      
      this.saveViewsToStorage(); // Persist to localStorage
      return { success: true, data: this.mockViews[viewIndex] };
    }
  
    async deleteView(viewId) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const viewIndex = this.mockViews.findIndex(view => view.id === viewId);
      if (viewIndex === -1) {
        return { success: false, error: 'View not found' };
      }
      
      this.mockViews.splice(viewIndex, 1);
      this.saveViewsToStorage(); // Persist to localStorage
      return { success: true };
    }
  
    async setDefaultView(viewId, pageType = 'reports') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // First, unset all default views for this page type
      this.mockViews.forEach(view => {
        if (view.page_type === pageType) {
          view.is_default = false;
        }
      });
      
      // Then set the selected view as default
      const view = this.mockViews.find(v => v.id === viewId);
      if (!view) {
        return { success: false, error: 'View not found' };
      }
      
      view.is_default = true;
      this.saveViewsToStorage(); // Persist to localStorage
      return { success: true, data: view };
    }
  }
  
  export default new ReportsViewsService();