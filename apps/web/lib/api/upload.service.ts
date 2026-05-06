import { api } from "@/lib/axios";
import type {
  ApiResponse,
  UploadSingleResponse,
  UploadMultipleResponse,
} from "@vaultkix/types";

export const uploadService = {
  async uploadSingle(
    file: File,
    folder?: string,
  ): Promise<UploadSingleResponse> {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await api.post<ApiResponse<UploadSingleResponse>>(
      "/upload/single",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: folder ? { folder } : undefined,
      },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async uploadMultiple(
    files: File[],
    folder?: string,
  ): Promise<UploadMultipleResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const { data } = await api.post<ApiResponse<UploadMultipleResponse>>(
      "/upload/multiple",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: folder ? { folder } : undefined,
      },
    );
    if (!data.success || !data.data) throw new Error(data.message);
    return data.data;
  },

  async deleteImage(url: string): Promise<void> {
    await api.delete("/upload", { data: { url } });
  },
};
