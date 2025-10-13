export interface JobSource {
  id: string;
  name: string;
  baseUrl: string;
  filterQuery: string;
  sentCount: number;
  rejectedCount: number;
  waitingCount: number;
  notes: string;
}

export interface ApplicationStats {
  totalSent: number;
  totalRejected: number;
  totalWaiting: number;
  weeklyGoal: number;
  lastUpdated: Date;
}

export interface UserSettings {
  weeklyGoal: number;
  theme: 'light' | 'dark';
}
