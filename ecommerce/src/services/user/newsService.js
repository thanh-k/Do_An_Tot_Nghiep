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

const userNewsService = {
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

    if (Array.isArray(response)) return response.map(mapPost);
    if (Array.isArray(response?.content)) return { ...response, content: response.content.map(mapPost) };
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
};

export default userNewsService;
