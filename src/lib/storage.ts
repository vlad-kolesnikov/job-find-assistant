import { JobSource, ApplicationStats, UserSettings } from '@/types/job';

const STORAGE_KEYS = {
  JOB_SOURCES: 'jobFindAssistant_jobSources',
  APP_STATS: 'jobFindAssistant_appStats',
  USER_SETTINGS: 'jobFindAssistant_userSettings',
};

export const storage = {
  getJobSources: (): JobSource[] => {
    const data = localStorage.getItem(STORAGE_KEYS.JOB_SOURCES);
    return data ? JSON.parse(data) : getDefaultJobSources();
  },

  setJobSources: (sources: JobSource[]) => {
    localStorage.setItem(STORAGE_KEYS.JOB_SOURCES, JSON.stringify(sources));
  },

  getAppStats: (): ApplicationStats => {
    const data = localStorage.getItem(STORAGE_KEYS.APP_STATS);
    return data ? JSON.parse(data) : getDefaultStats();
  },

  setAppStats: (stats: ApplicationStats) => {
    localStorage.setItem(STORAGE_KEYS.APP_STATS, JSON.stringify(stats));
  },

  getUserSettings: (): UserSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return data ? JSON.parse(data) : getDefaultSettings();
  },

  setUserSettings: (settings: UserSettings) => {
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
  },
};

const getDefaultJobSources = (): JobSource[] => [
  {
    id: '1',
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com/jobs/search/?',
    filterQuery: 'keywords=QA%20Automation&location=Remote&f_WT=2',
    sentCount: 0,
    rejectedCount: 0,
    waitingCount: 0,
    notes: '',
  },
  {
    id: '2',
    name: 'Jooble',
    baseUrl: 'https://jooble.org/jobs-',
    filterQuery: 'qa-automation/Remote',
    sentCount: 0,
    rejectedCount: 0,
    waitingCount: 0,
    notes: '',
  },
  {
    id: '3',
    name: 'Himalayas',
    baseUrl: 'https://himalayas.app/jobs?',
    filterQuery: 'search=QA%20Automation&locations=Remote',
    sentCount: 0,
    rejectedCount: 0,
    waitingCount: 0,
    notes: '',
  },
];

const getDefaultStats = (): ApplicationStats => ({
  totalSent: 0,
  totalRejected: 0,
  totalWaiting: 0,
  weeklyGoal: 10,
  lastUpdated: new Date(),
});

const getDefaultSettings = (): UserSettings => ({
  weeklyGoal: 10,
  theme: 'light',
});
