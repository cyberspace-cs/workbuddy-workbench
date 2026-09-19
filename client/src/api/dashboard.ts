import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { DashboardStats, TimelineItem, GrowthStats } from '@shared/api.interface';

export const getStats = async (): Promise<DashboardStats> => {
  const res = await axiosForBackend.get('/api/dashboard/stats');
  return res.data;
};

export const getRecentMaterials = async (limit = 5) => {
  const res = await axiosForBackend.get(`/api/dashboard/recent-materials?limit=${limit}`);
  return res.data;
};

export const getTimeline = async (limit = 30): Promise<TimelineItem[]> => {
  const res = await axiosForBackend.get(`/api/dashboard/timeline?limit=${limit}`);
  return res.data;
};

export const getGrowthStats = async (): Promise<GrowthStats> => {
  const res = await axiosForBackend.get('/api/dashboard/growth');
  return res.data;
};
