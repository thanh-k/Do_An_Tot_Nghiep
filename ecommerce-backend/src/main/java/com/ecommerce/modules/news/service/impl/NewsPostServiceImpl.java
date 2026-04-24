package com.ecommerce.modules.news.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.common.util.SlugUtil;
import com.ecommerce.entity.User;
import com.ecommerce.modules.news.dto.request.NewsPostRequest;
import com.ecommerce.modules.news.dto.request.NewsPostStatusRequest;
import com.ecommerce.modules.news.dto.response.NewsPostResponse;
import com.ecommerce.modules.news.entity.NewsPost;
import com.ecommerce.modules.news.entity.NewsPostStatus;
import com.ecommerce.modules.news.entity.NewsTopic;
import com.ecommerce.modules.news.repository.NewsPostRepository;
import com.ecommerce.modules.news.repository.NewsTopicRepository;
import com.ecommerce.modules.news.service.NewsPostService;
import com.ecommerce.modules.upload.service.CloudinaryService;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NewsPostServiceImpl implements NewsPostService {

    private final NewsPostRepository newsPostRepository;
    private final NewsTopicRepository newsTopicRepository;
    private final UserRepository userRepository;
    private final NewsMapper newsMapper;
    private final CloudinaryService cloudinaryService;

    @Override
    public List<NewsPostResponse> getPublicPosts(String topicSlug, String keyword) {
        return newsPostRepository.searchPosts(NewsPostStatus.PUBLISHED, blankToNull(topicSlug), blankToNull(keyword)).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    public NewsPostResponse getFeaturedPost() {
        List<NewsPost> featured = newsPostRepository.findTop1ByFeaturedTrueAndStatusOrderByPublishedAtDescCreatedAtDesc(NewsPostStatus.PUBLISHED);
        if (!featured.isEmpty()) {
            return newsMapper.toPostResponse(featured.get(0));
        }
        return newsPostRepository.searchPosts(NewsPostStatus.PUBLISHED, null, null).stream()
                .findFirst()
                .map(newsMapper::toPostResponse)
                .orElse(null);
    }

    @Override
    public List<NewsPostResponse> getTrendingPosts() {
        return newsPostRepository.findTop5ByStatusOrderByViewCountDescPublishedAtDesc(NewsPostStatus.PUBLISHED).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    @Transactional
    public NewsPostResponse getPublicPostDetail(String slug) {
        NewsPost post = newsPostRepository.findBySlugIgnoreCaseAndStatus(slug, NewsPostStatus.PUBLISHED)
                .orElseThrow(() -> new AppException(ErrorCode.NEWS_POST_NOT_FOUND));
        post.setViewCount((post.getViewCount() == null ? 0L : post.getViewCount()) + 1);
        newsPostRepository.save(post);
        return newsMapper.toPostResponse(post);
    }

    @Override
    public List<NewsPostResponse> getRelatedPosts(Long id) {
        NewsPost post = findPostById(id);
        return newsPostRepository.findTop4ByTopicIdAndStatusAndIdNotOrderByPublishedAtDesc(post.getTopic().getId(), NewsPostStatus.PUBLISHED, id).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    public List<NewsPostResponse> getAdminPosts(String keyword, String topicSlug, String status) {
        NewsPostStatus parsedStatus = blankToNull(status) == null ? null : NewsPostStatus.valueOf(status.toUpperCase());
        return newsPostRepository.searchPosts(parsedStatus, blankToNull(topicSlug), blankToNull(keyword)).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    @Transactional
    public NewsPostResponse create(NewsPostRequest request, MultipartFile file) throws IOException {
        validatePostRequest(request);
        NewsTopic topic = findTopicById(request.getTopicId());
        User author = getCurrentAuthenticatedUser();

        NewsPostStatus status = request.getStatus() == null ? NewsPostStatus.DRAFT : request.getStatus();
        String thumbnail = uploadThumbnail(file, null);

        NewsPost post = NewsPost.builder()
                .title(request.getTitle().trim())
                .slug(buildUniquePostSlug(request.getTitle(), null))
                .summary(blankToNull(request.getSummary()))
                .content(request.getContent().trim())
                .thumbnail(thumbnail)
                .status(status)
                .featured(Boolean.TRUE.equals(request.getFeatured()))
                .viewCount(0L)
                .topic(topic)
                .author(author)
                .publishedAt(status == NewsPostStatus.PUBLISHED ? LocalDateTime.now() : null)
                .build();

        handleFeatured(post);
        return newsMapper.toPostResponse(newsPostRepository.save(post));
    }

    @Override
    @Transactional
    public NewsPostResponse update(Long id, NewsPostRequest request, MultipartFile file) throws IOException {
        validatePostRequest(request);
        NewsPost post = findPostById(id);
        NewsTopic topic = findTopicById(request.getTopicId());

        post.setTitle(request.getTitle().trim());
        post.setSlug(buildUniquePostSlug(request.getTitle(), id));
        post.setSummary(blankToNull(request.getSummary()));
        post.setContent(request.getContent().trim());
        post.setTopic(topic);
        post.setFeatured(Boolean.TRUE.equals(request.getFeatured()));

        if (file != null && !file.isEmpty()) {
            post.setThumbnail(uploadThumbnail(file, post.getThumbnail()));
        }

        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
            if (request.getStatus() == NewsPostStatus.PUBLISHED && post.getPublishedAt() == null) {
                post.setPublishedAt(LocalDateTime.now());
            }
            if (request.getStatus() != NewsPostStatus.PUBLISHED) {
                post.setPublishedAt(null);
            }
        }

        handleFeatured(post);
        return newsMapper.toPostResponse(newsPostRepository.save(post));
    }

    @Override
    @Transactional
    public NewsPostResponse updateStatus(Long id, NewsPostStatusRequest request) {
        NewsPost post = findPostById(id);
        if (request.getStatus() == null) {
            throw new AppException(ErrorCode.NEWS_POST_STATUS_REQUIRED);
        }
        post.setStatus(request.getStatus());
        if (request.getStatus() == NewsPostStatus.PUBLISHED && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        if (request.getStatus() != NewsPostStatus.PUBLISHED) {
            post.setPublishedAt(null);
        }
        return newsMapper.toPostResponse(newsPostRepository.save(post));
    }

    @Override
    @Transactional
    public NewsPostResponse toggleFeatured(Long id) {
        NewsPost post = findPostById(id);
        post.setFeatured(!Boolean.TRUE.equals(post.getFeatured()));
        handleFeatured(post);
        return newsMapper.toPostResponse(newsPostRepository.save(post));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        NewsPost post = findPostById(id);
        if (post.getThumbnail() != null && !post.getThumbnail().isBlank() && post.getThumbnail().startsWith("http")) {
            try {
                cloudinaryService.deleteFile(post.getThumbnail());
            } catch (IOException ignored) {
            }
        }
        newsPostRepository.delete(post);
    }

    private void validatePostRequest(NewsPostRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new AppException(ErrorCode.NEWS_POST_REQUIRED);
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new AppException(ErrorCode.NEWS_POST_CONTENT_REQUIRED);
        }
        if (request.getTopicId() == null) {
            throw new AppException(ErrorCode.NEWS_TOPIC_REQUIRED);
        }
    }

    private String uploadThumbnail(MultipartFile file, String oldUrl) throws IOException {
        if (file == null || file.isEmpty()) {
            return oldUrl;
        }
        if (oldUrl != null && !oldUrl.isBlank() && oldUrl.startsWith("http")) {
            try {
                cloudinaryService.deleteFile(oldUrl);
            } catch (IOException ignored) {
            }
        }
        return cloudinaryService.uploadFile(file, "news");
    }

    private void handleFeatured(NewsPost target) {
        if (!Boolean.TRUE.equals(target.getFeatured())) {
            return;
        }
        List<NewsPost> allPosts = newsPostRepository.findAll();
        for (NewsPost post : allPosts) {
            if (target.getId() == null || !post.getId().equals(target.getId())) {
                if (Boolean.TRUE.equals(post.getFeatured())) {
                    post.setFeatured(false);
                    newsPostRepository.save(post);
                }
            }
        }
    }

    private String buildUniquePostSlug(String title, Long id) {
        String base = SlugUtil.makeSlug(title);
        String candidate = base;
        int index = 1;
        NewsPost current = id == null ? null : findPostById(id);
        if (current != null && candidate.equalsIgnoreCase(current.getSlug())) {
            return candidate;
        }
        while (id == null ? newsPostRepository.existsBySlugIgnoreCase(candidate) : newsPostRepository.existsBySlugIgnoreCaseAndIdNot(candidate, id)) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }

    private NewsPost findPostById(Long id) {
        return newsPostRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NEWS_POST_NOT_FOUND));
    }

    private NewsTopic findTopicById(Long id) {
        return newsTopicRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NEWS_TOPIC_NOT_FOUND));
    }

    private User getCurrentAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
