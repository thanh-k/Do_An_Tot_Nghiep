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
  author: post.authorName,
  image: post.thumbnail,
  date: post.publishedAt || post.createdAt,
  views: post.viewCount || 0,
});

function buildPostFormData(payload) {
  const formData = new FormData();
  const { file, previewUrl, id, ...rest } = payload;

  formData.append(
    "data",
    new Blob([JSON.stringify(rest)], { type: "application/json" })
  );

  if (file instanceof File) {
    formData.append("file", file);
  }

  return formData;
}

export const newsService = {
  async getTopics() {
    return (await apiClient.request("/news/topics")).map(mapTopic);
  },

  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.topicSlug) query.set("topicSlug", params.topicSlug);
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.page !== undefined) query.set("page", params.page);
    if (params.size !== undefined) query.set("size", params.size);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.request(`/news/posts${suffix}`);

    if (Array.isArray(response)) {
      return response.map(mapPost);
    }

    if (Array.isArray(response?.content)) {
      return {
        ...response,
        content: response.content.map(mapPost),
      };
    }

    return [];
  },

  async getFeaturedPost() {
    const post = await apiClient.request("/news/posts/featured");
    return post ? mapPost(post) : null;
  },

  async getTrendingPosts() {
    return (await apiClient.request("/news/posts/trending")).map(mapPost);
  },

  async getPostDetail(slug) {
    return mapPost(await apiClient.request(`/news/posts/${slug}`));
  },

  async getRelatedPosts(id) {
    return (await apiClient.request(`/news/posts/id/${id}/related`)).map(mapPost);
  },

  async getAdminTopics() {
    return (await apiClient.request("/admin/news/topics")).map(mapTopic);
  },

  async saveTopic(payload) {
    if (payload.id) {
      return mapTopic(
        await apiClient.request(`/admin/news/topics/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );
    }

    return mapTopic(
      await apiClient.request("/admin/news/topics", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  },

  async toggleTopicStatus(id, force = false) {
    return mapTopic(
      await apiClient.request(`/admin/news/topics/${id}/toggle-status?force=${force}`, {
        method: "PATCH",
      })
    );
  },

  async deleteTopic(id, force = false) {
    return apiClient.request(`/admin/news/topics/${id}?force=${force}`, {
      method: "DELETE",
    });
  },

  async getAdminPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.topicSlug) query.set("topicSlug", params.topicSlug);
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.status) query.set("status", params.status);
    if (params.topicSlug) query.set("topicSlug", params.topicSlug);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return (await apiClient.request(`/admin/news/posts${suffix}`)).map(mapPost);
  },

  async savePost(payload) {
    const body = buildPostFormData(payload);

    if (payload.id) {
      return mapPost(
        await apiClient.request(`/admin/news/posts/${payload.id}`, {
          method: "PUT",
          body,
        })
      );
    }

    return mapPost(
      await apiClient.request("/admin/news/posts", {
        method: "POST",
        body,
      })
    );
  },

  async updatePostStatus(id, status) {
    return mapPost(
      await apiClient.request(`/admin/news/posts/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
    );
  },

  async toggleFeatured(id) {
    return mapPost(
      await apiClient.request(`/admin/news/posts/${id}/featured`, {
        method: "PATCH",
      })
    );
  },

  async deletePost(id) {
    return apiClient.request(`/admin/news/posts/${id}`, {
      method: "DELETE",
    });
  },
};

export default newsService;
