import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Project,
  ProjectListParams,
  CreateProjectRequest,
  UpdateProjectRequest,
  Material,
} from '@shared/api.interface';

export const getList = async (params?: ProjectListParams): Promise<Project[]> => {
  const res = await axiosForBackend.get('/api/projects', { params });
  return res.data;
};

export const getDetail = async (id: string): Promise<Project> => {
  const res = await axiosForBackend.get(`/api/projects/${id}`);
  return res.data;
};

export const getMaterials = async (id: string): Promise<Material[]> => {
  const res = await axiosForBackend.get(`/api/projects/${id}/materials`);
  return res.data;
};

export const create = async (data: CreateProjectRequest): Promise<Project> => {
  const res = await axiosForBackend.post('/api/projects', data);
  return res.data;
};

export const update = async (id: string, data: UpdateProjectRequest): Promise<Project> => {
  const res = await axiosForBackend.patch(`/api/projects/${id}`, data);
  return res.data;
};

export const remove = async (id: string): Promise<void> => {
  await axiosForBackend.delete(`/api/projects/${id}`);
};
