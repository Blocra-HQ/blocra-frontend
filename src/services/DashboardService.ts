import { type Layout } from 'react-grid-layout';

export interface DashboardConfig {
  id: string;
  name: string;
  layout: Layout;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  query?: string;
  data?: any;
  options?: any;
}

export class DashboardService {
  private static STORAGE_KEY = 'saved_dashboards';

  static saveDashboard(dashboard: DashboardConfig): void {
    const dashboards = this.getSavedDashboards();
    const existingIndex = dashboards.findIndex(d => d.id === dashboard.id);
    
    if (existingIndex >= 0) {
      dashboards[existingIndex] = {
        ...dashboard,
        updatedAt: new Date().toISOString()
      };
    } else {
      dashboards.push({
        ...dashboard,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dashboards));
  }

  static getSavedDashboards(): DashboardConfig[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  static getDashboardById(id: string): DashboardConfig | null {
    const dashboards = this.getSavedDashboards();
    return dashboards.find(d => d.id === id) || null;
  }

  static deleteDashboard(id: string): void {
    const dashboards = this.getSavedDashboards();
    const filtered = dashboards.filter(d => d.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }
}