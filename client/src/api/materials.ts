import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Material,
  MaterialListParams,
  MaterialListResponse,
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from '@shared/api.interface';

export const getList = async (params: MaterialListParams): Promise<MaterialListResponse> => {
  const res = await axiosForBackend.get('/api/materials', { params });
  return res.data;
};

export const getDetail = async (id: string): Promise<Material> => {
  const res = await axiosForBackend.get(`/api/materials/${id}`);
  return res.data;
};

export const create = async (data: CreateMaterialRequest): Promise<Material> => {
  const res = await axiosForBackend.post('/api/materials', data);
  return res.data;
};

export const update = async (id: string, data: UpdateMaterialRequest): Promise<Material> => {
  const res = await axiosForBackend.patch(`/api/materials/${id}`, data);
  return res.data;
};

export const remove = async (id: string): Promise<void> => {
  await axiosForBackend.delete(`/api/materials/${id}`);
};
