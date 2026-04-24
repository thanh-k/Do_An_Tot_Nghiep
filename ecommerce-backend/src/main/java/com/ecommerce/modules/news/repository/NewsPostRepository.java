package com.ecommerce.modules.news.repository;

import com.ecommerce.modules.news.entity.NewsPost;
import com.ecommerce.modules.news.entity.NewsPostStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NewsPostRepository extends JpaRepository<NewsPost, Long> {

    boolean existsBySlugIgnoreCase(String slug);
    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);
    @Query("select count(p) from NewsPost p where p.topic.id = :topicId")
    long countByTopicId(@Param("topicId") Long topicId);

    @Query("select p from NewsPost p where p.topic.id = :topicId")
    List<NewsPost> findByTopicId(@Param("topicId") Long topicId);

    @Query("delete from NewsPost p where p.topic.id = :topicId")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByTopicId(@Param("topicId") Long topicId);

    @Override
    @EntityGraph(attributePaths = {"topic", "author"})
    List<NewsPost> findAll();

    @Override
    @EntityGraph(attributePaths = {"topic", "author"})
    Optional<NewsPost> findById(Long id);

    @EntityGraph(attributePaths = {"topic", "author"})
    Optional<NewsPost> findBySlugIgnoreCase(String slug);

    @EntityGraph(attributePaths = {"topic", "author"})
    Optional<NewsPost> findBySlugIgnoreCaseAndStatus(String slug, NewsPostStatus status);

    @EntityGraph(attributePaths = {"topic", "author"})
    List<NewsPost> findTop1ByFeaturedTrueAndStatusOrderByPublishedAtDescCreatedAtDesc(NewsPostStatus status);

    @EntityGraph(attributePaths = {"topic", "author"})
    List<NewsPost> findTop5ByStatusOrderByViewCountDescPublishedAtDesc(NewsPostStatus status);

    @EntityGraph(attributePaths = {"topic", "author"})
    List<NewsPost> findTop4ByTopicIdAndStatusAndIdNotOrderByPublishedAtDesc(Long topicId, NewsPostStatus status, Long id);

    @Query("""
        select p from NewsPost p
        join fetch p.topic t
        join fetch p.author a
        where (:status is null or p.status = :status)
          and (:topicSlug is null or lower(t.slug) = lower(:topicSlug))
          and (:keyword is null or lower(p.title) like lower(concat('%', :keyword, '%'))
               or lower(coalesce(p.summary, '')) like lower(concat('%', :keyword, '%')))
        order by
          case when p.featured = true then 0 else 1 end,
          coalesce(p.publishedAt, p.createdAt) desc
    """)
    List<NewsPost> searchPosts(@Param("status") NewsPostStatus status, @Param("topicSlug") String topicSlug, @Param("keyword") String keyword);
}
