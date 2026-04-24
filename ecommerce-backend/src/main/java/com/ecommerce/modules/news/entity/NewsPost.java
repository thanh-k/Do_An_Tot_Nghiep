package com.ecommerce.modules.news.entity;

import com.ecommerce.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "news_posts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(unique = true)
    private String slug;

    @Column(length = 1000)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String thumbnail;

    @Enumerated(EnumType.STRING)
    private NewsPostStatus status;

    private Boolean featured = false;

    private Long viewCount = 0L;

    private LocalDateTime publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 🔗 Quan hệ
    @ManyToOne
    @JoinColumn(name = "topic_id")
    private NewsTopic topic;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private User author;
}