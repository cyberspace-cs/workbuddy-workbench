import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Report,
  ReportListParams,
  ReportListResponse,
  CreateReportRequest,
} from '@shared/api.interface';

export const getList = async (params: ReportListParams): Promise<ReportListResponse> => {
  const res = await axiosForBackend.get('/api/reports', { params });
  return res.data;
};

export const getDetail = async (id: string): Promise<Report> => {
  const res = await axiosForBackend.get(`/api/reports/${id}`);
  return res.data;
};

export const create = async (data: CreateReportRequest): Promise<Report> => {
  const res = await axiosForBackend.post('/api/reports', data);
  return res.data;
};

export const remove = async (id: string): Promise<void> => {
  await axiosForBackend.delete(`/api/reports/${id}`);
};

export const generateFromMaterials = async (
  type: 'weekly' | 'monthly',
  materialIds: string[],
): Promise<Report> => {
  const res = await axiosForBackend.post('/api/reports/generate', { type, materialIds });
  return res.data;
};
