package com.ecommerce.modules.news.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.common.util.SlugUtil;
import com.ecommerce.modules.news.dto.request.NewsTopicRequest;
import com.ecommerce.modules.news.dto.response.NewsTopicResponse;
import com.ecommerce.modules.news.entity.NewsPost;
import com.ecommerce.modules.news.entity.NewsPostStatus;
import com.ecommerce.modules.news.entity.NewsTopic;
import com.ecommerce.modules.news.repository.NewsPostRepository;
import com.ecommerce.modules.news.repository.NewsTopicRepository;
import com.ecommerce.modules.news.service.NewsTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NewsTopicServiceImpl implements NewsTopicService {

    private final NewsTopicRepository newsTopicRepository;
    private final NewsPostRepository newsPostRepository;
    private final NewsMapper newsMapper;

    @Override
    public List<NewsTopicResponse> getPublicTopics() {
        return newsTopicRepository.findAllByActiveTrueOrderByDisplayOrderAscNameAsc().stream()
                .map(this::toTopicResponseWithCount)
                .toList();
    }

    @Override
    public List<NewsTopicResponse> getAdminTopics() {
        return newsTopicRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(this::toTopicResponseWithCount)
                .toList();
    }

    @Override
    @Transactional
    public NewsTopicResponse create(NewsTopicRequest request) {
        validateTopicName(request.getName(), null);
        NewsTopic topic = NewsTopic.builder()
                .name(request.getName().trim())
                .slug(buildUniqueTopicSlug(request.getName(), null))
                .description(request.getDescription())
                .active(request.getActive() == null ? true : request.getActive())
                .displayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder())
                .build();
        return toTopicResponseWithCount(newsTopicRepository.save(topic));
    }

    @Override
    @Transactional
    public NewsTopicResponse update(Long id, NewsTopicRequest request) {
        NewsTopic topic = findTopicById(id);
        validateTopicName(request.getName(), id);
        topic.setName(request.getName().trim());
        topic.setSlug(buildUniqueTopicSlug(request.getName(), id));
        topic.setDescription(request.getDescription());
        topic.setActive(request.getActive() == null ? topic.getActive() : request.getActive());
        topic.setDisplayOrder(request.getDisplayOrder() == null ? topic.getDisplayOrder() : request.getDisplayOrder());
        return toTopicResponseWithCount(newsTopicRepository.save(topic));
    }

    @Override
    @Transactional
    public NewsTopicResponse toggleStatus(Long id, boolean force) {
        NewsTopic topic = findTopicById(id);
        boolean willHide = Boolean.TRUE.equals(topic.getActive());
        long totalPosts = newsPostRepository.countByTopicId(id);

        if (willHide && totalPosts > 0) {
            if (!force) {
                throw new AppException(ErrorCode.NEWS_TOPIC_HAS_POSTS);
            }
            List<NewsPost> posts = newsPostRepository.findByTopicId(id);
            for (NewsPost post : posts) {
                post.setStatus(NewsPostStatus.HIDDEN);
            }
            newsPostRepository.saveAll(posts);
        }

        topic.setActive(!Boolean.TRUE.equals(topic.getActive()));
        return toTopicResponseWithCount(newsTopicRepository.save(topic));
    }

    @Override
    @Transactional
    public void delete(Long id, boolean force) {
        NewsTopic topic = findTopicById(id);
        long totalPosts = newsPostRepository.countByTopicId(id);
        if (totalPosts > 0 && !force) {
            throw new AppException(ErrorCode.NEWS_TOPIC_HAS_POSTS);
        }
        if (totalPosts > 0) {
            newsPostRepository.deleteByTopicId(id);
        }
        newsTopicRepository.delete(topic);
    }

    private void validateTopicName(String name, Long id) {
        if (name == null || name.isBlank()) {
            throw new AppException(ErrorCode.NEWS_TOPIC_REQUIRED);
        }
        boolean existed = id == null
                ? newsTopicRepository.existsByNameIgnoreCase(name.trim())
                : newsTopicRepository.existsByNameIgnoreCaseAndIdNot(name.trim(), id);
        if (existed) {
            throw new AppException(ErrorCode.NEWS_TOPIC_ALREADY_EXISTS);
        }
    }

    private String buildUniqueTopicSlug(String name, Long id) {
        String base = SlugUtil.makeSlug(name);
        String candidate = base;
        int index = 1;
        while (id == null ? newsTopicRepository.existsBySlugIgnoreCase(candidate) : false) {
            candidate = base + "-" + index++;
        }
        if (id != null) {
            NewsTopic current = findTopicById(id);
            if (candidate.equalsIgnoreCase(current.getSlug())) {
                return candidate;
            }
            while (newsTopicRepository.existsBySlugIgnoreCase(candidate)) {
                candidate = base + "-" + index++;
            }
        }
        return candidate;
    }

    private NewsTopic findTopicById(Long id) {
        return newsTopicRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NEWS_TOPIC_NOT_FOUND));
    }

    private NewsTopicResponse toTopicResponseWithCount(NewsTopic topic) {
        NewsTopicResponse response = newsMapper.toTopicResponse(topic);
        response.setPostCount((int) newsPostRepository.countByTopicId(topic.getId()));
        return response;
    }
}
