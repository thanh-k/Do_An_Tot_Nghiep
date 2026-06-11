import apiClient from "@/services/apiClient";

const PUBLIC_URL = "/livestreams";
const ADMIN_URL = "/admin/livestreams";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export const livestreamService = {
  getLiveStreams() {
    return apiClient.request(PUBLIC_URL).then(normalizeList);
  },
  getLivestream(id) {
    return apiClient.request(`${PUBLIC_URL}/${id}`);
  },
  getChatMessages(id) {
    return apiClient.request(`${PUBLIC_URL}/${id}/chat-messages`).then(normalizeList);
  },
  increaseViewer(id) {
    return apiClient.request(`${PUBLIC_URL}/${id}/view`, { method: "POST" });
  },
  getAdminLivestreams() {
    return apiClient.request(ADMIN_URL).then(normalizeList);
  },
  createLivestream(payload) {
    return apiClient.request(ADMIN_URL, { method: "POST", body: JSON.stringify(payload) });
  },
  updateLivestream(id, payload) {
    return apiClient.request(`${ADMIN_URL}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  deleteLivestream(id) {
    return apiClient.request(`${ADMIN_URL}/${id}`, { method: "DELETE" });
  },
  uploadThumbnail(file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.request(`${ADMIN_URL}/upload-thumbnail`, { method: "POST", body: formData });
  },
  updateStatus(id, status) {
    return apiClient.request(`${ADMIN_URL}/${id}/status`, { method: "PUT", params: { status } });
  },
  addProduct(livestreamId, productId) {
    return apiClient.request(`${ADMIN_URL}/${livestreamId}/products/${productId}`, { method: "POST" });
  },
  removeProduct(livestreamId, productId) {
    return apiClient.request(`${ADMIN_URL}/${livestreamId}/products/${productId}`, { method: "DELETE" });
  },
  pinProduct(livestreamId, productId) {
    return apiClient.request(`${ADMIN_URL}/${livestreamId}/pin/${productId}`, { method: "POST" });
  },
  unpinProduct(livestreamId) {
    return apiClient.request(`${ADMIN_URL}/${livestreamId}/unpin`, { method: "POST" });
  },
  createDeal(livestreamId, payload) {
    return apiClient.request(`${ADMIN_URL}/${livestreamId}/deals`, { method: "POST", body: JSON.stringify(payload) });
  },
};

export default livestreamService;
