import apiClient from "@/services/apiClient";

const mapTopic = (topic) => ({
  ...topic,
  postCount: topic.postCount || 0,
});

const mapPost = (post) => ({
  ...post,
  category: post.topicName,
  topic: {
    id: post.topicId,
    name: post.topicName,
    slug: post.topicSlug,
  },
  author: post.authorName || post.sourceName || "InsightShop",
  image: post.thumbnail,
  date: post.publishedAt || post.createdAt,
  views: post.viewCount || 0,
  sourceType: post.sourceType || "INTERNAL",
  isExternal: post.sourceType === "EXTERNAL",
  sourceName: post.sourceName,
  sourceUrl: post.sourceUrl || post.originalUrl,
});

function buildPostFormData(payload) {
  const formData = new FormData();
  const { file, previewUrl, id, ...rest } = payload;

  formData.append("data", new Blob([JSON.stringify(rest)], { type: "application/json" }));
  if (file instanceof File) formData.append("file", file);
  return formData;
}

const adminNewsService = {
  async getTopics() {
    return (await apiClient.request("/admin/news/topics")).map(mapTopic);
  },

  async saveTopic(payload) {
    if (payload.id) {
      return mapTopic(await apiClient.request(`/admin/news/topics/${payload.id}`, { method: "PUT", body: JSON.stringify(payload) }));
    }
    return mapTopic(await apiClient.request("/admin/news/topics", { method: "POST", body: JSON.stringify(payload) }));
  },

  async toggleTopicStatus(id, force = false) {
    return mapTopic(await apiClient.request(`/admin/news/topics/${id}/toggle-status?force=${force}`, { method: "PATCH" }));
  },

  async deleteTopic(id, force = false) {
    return apiClient.request(`/admin/news/topics/${id}?force=${force}`, { method: "DELETE" });
  },

  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.topicSlug) query.set("topicSlug", params.topicSlug);
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.status) query.set("status", params.status);
    if (params.sourceType) query.set("sourceType", params.sourceType);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return (await apiClient.request(`/admin/news/posts${suffix}`)).map(mapPost);
  },

  async savePost(payload) {
    const body = buildPostFormData(payload);
    if (payload.id) {
      return mapPost(await apiClient.request(`/admin/news/posts/${payload.id}`, { method: "PUT", body }));
    }
    return mapPost(await apiClient.request("/admin/news/posts", { method: "POST", body }));
  },

  async updatePostStatus(id, status) {
    return mapPost(await apiClient.request(`/admin/news/posts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }));
  },

  async toggleFeatured(id) {
    return mapPost(await apiClient.request(`/admin/news/posts/${id}/featured`, { method: "PATCH" }));
  },

  async syncExternalPosts() {
    return (await apiClient.request("/admin/external-news/sync", { method: "POST" })).map(mapPost);
  },

  async deletePost(id) {
    return apiClient.request(`/admin/news/posts/${id}`, { method: "DELETE" });
  },
};

export default adminNewsService;
