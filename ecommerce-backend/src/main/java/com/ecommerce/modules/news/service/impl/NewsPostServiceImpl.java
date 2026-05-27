package com.ecommerce.modules.news.service.impl;

import com.ecommerce.common.exception.AppException;
import com.ecommerce.common.exception.ErrorCode;
import com.ecommerce.common.util.SlugUtil;
import com.ecommerce.entity.User;
import com.ecommerce.modules.news.dto.request.NewsPostRequest;
import com.ecommerce.modules.news.dto.request.NewsPostStatusRequest;
import com.ecommerce.modules.news.dto.response.NewsPostResponse;
import com.ecommerce.modules.news.entity.NewsPost;
import com.ecommerce.modules.news.entity.NewsPostSourceType;
import com.ecommerce.modules.news.entity.NewsPostStatus;
import com.ecommerce.modules.news.entity.NewsTopic;
import com.ecommerce.modules.news.repository.NewsPostRepository;
import com.ecommerce.modules.news.repository.NewsTopicRepository;
import com.ecommerce.modules.news.service.NewsPostService;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.upload.service.CloudinaryService;
import com.ecommerce.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsPostServiceImpl implements NewsPostService {

    private static final String EXTERNAL_TOPIC_NAME = "Tin công nghệ";
    private static final String EXTERNAL_TOPIC_SLUG = "tin-cong-nghe";
    private static final String EXTERNAL_NEWS_BOT_EMAIL = "system-news-bot@insightshop.local";
    private static final String EXTERNAL_NEWS_BOT_NAME = "InsightShop News Bot";
    private static final long EXTERNAL_SYNC_INTERVAL_MS = 60 * 60 * 1000L;
    private static final int EXTERNAL_LIMIT_PER_SOURCE = 6;
    private static final int MAX_TITLE_LENGTH = 240;
    private static final int MAX_SUMMARY_LENGTH = 320;
    private static final int MAX_URL_LENGTH = 900;
    private static final int MAX_SOURCE_NAME_LENGTH = 180;
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private static volatile long lastExternalSyncAt = 0L;

    private final NewsPostRepository newsPostRepository;
    private final NewsTopicRepository newsTopicRepository;
    private final UserRepository userRepository;
    private final NewsMapper newsMapper;
    private final CloudinaryService cloudinaryService;

    private record RssSource(String name, String url) {}

    private final List<RssSource> vietnamTechnologySources = List.of(
            new RssSource("VnExpress Số hóa", "https://vnexpress.net/rss/so-hoa.rss"),
            new RssSource("Dân trí Công nghệ", "https://dantri.com.vn/cong-nghe.rss"),
            new RssSource("VietnamNet Công nghệ", "https://vietnamnet.vn/rss/cong-nghe.rss"),
            new RssSource("Thanh Niên Công nghệ", "https://thanhnien.vn/rss/cong-nghe-game.rss"),
            new RssSource("Tuổi Trẻ Nhịp sống số", "https://tuoitre.vn/rss/nhip-song-so.rss")
    );

    @Override
    public List<NewsPostResponse> getPublicPosts(String topicSlug, String keyword, String sourceType) {
        syncExternalNewsIfNeeded();
        NewsPostSourceType parsedSourceType = parseSourceType(sourceType);
        return newsPostRepository.searchPosts(NewsPostStatus.PUBLISHED, blankToNull(topicSlug), blankToNull(keyword), parsedSourceType).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    public NewsPostResponse getFeaturedPost() {
        syncExternalNewsIfNeeded();
        List<NewsPost> featured = newsPostRepository.findTop1ByFeaturedTrueAndStatusOrderByPublishedAtDescCreatedAtDesc(NewsPostStatus.PUBLISHED);
        if (!featured.isEmpty()) {
            return newsMapper.toPostResponse(featured.get(0));
        }
        return newsPostRepository.searchPosts(NewsPostStatus.PUBLISHED, null, null, null).stream()
                .findFirst()
                .map(newsMapper::toPostResponse)
                .orElse(null);
    }

    @Override
    public List<NewsPostResponse> getTrendingPosts() {
        syncExternalNewsIfNeeded();
        return newsPostRepository.findTop5ByStatusOrderByViewCountDescPublishedAtDesc(NewsPostStatus.PUBLISHED).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    public NewsPostResponse getPublicPostDetail(String slug) {
        syncExternalNewsIfNeeded();
        NewsPost post = newsPostRepository.findBySlugIgnoreCaseAndStatus(slug, NewsPostStatus.PUBLISHED)
                .orElseThrow(() -> new AppException(ErrorCode.NEWS_POST_NOT_FOUND));
        post.setViewCount((post.getViewCount() == null ? 0L : post.getViewCount()) + 1);
        newsPostRepository.save(post);
        return newsMapper.toPostResponse(post);
    }

    @Override
    public List<NewsPostResponse> getRelatedPosts(Long id) {
        NewsPost post = findPostById(id);
        if (post.getTopic() == null) return List.of();
        return newsPostRepository.findTop4ByTopicIdAndStatusAndIdNotOrderByPublishedAtDesc(post.getTopic().getId(), NewsPostStatus.PUBLISHED, id).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    public List<NewsPostResponse> getAdminPosts(String keyword, String topicSlug, String status, String sourceType) {
        NewsPostStatus parsedStatus = blankToNull(status) == null ? null : NewsPostStatus.valueOf(status.toUpperCase());
        NewsPostSourceType parsedSourceType = parseSourceType(sourceType);
        return newsPostRepository.searchPosts(parsedStatus, blankToNull(topicSlug), blankToNull(keyword), parsedSourceType).stream()
                .map(newsMapper::toPostResponse)
                .toList();
    }

    @Override
    public List<NewsPostResponse> syncExternalTechnologyNews() {
        NewsTopic externalTopic = getOrCreateExternalTechnologyTopic();
        List<NewsPost> savedPosts = new ArrayList<>();
        User externalAuthor = resolveExternalNewsAuthor();

        for (RssSource source : vietnamTechnologySources) {
            try {
                savedPosts.addAll(fetchAndSaveSource(source, externalTopic, externalAuthor));
            } catch (Exception e) {
                // Không để một nguồn RSS lỗi làm hỏng toàn bộ chức năng đồng bộ.
                log.warn("Không đồng bộ được nguồn tin RSS: {}", source.name(), e);
            }
        }

        lastExternalSyncAt = System.currentTimeMillis();
        log.info("RSS sync hoàn tất, tổng số tin mới lưu được: {}", savedPosts.size());
        return savedPosts.stream().map(newsMapper::toPostResponse).toList();
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
                .sourceType(NewsPostSourceType.INTERNAL)
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

    private void syncExternalNewsIfNeeded() {
        long now = System.currentTimeMillis();
        if (now - lastExternalSyncAt < EXTERNAL_SYNC_INTERVAL_MS) return;
        try {
            syncExternalTechnologyNews();
        } catch (Exception ignored) {
            lastExternalSyncAt = now;
        }
    }

    private List<NewsPost> fetchAndSaveSource(RssSource source, NewsTopic topic, User externalAuthor) {
        List<NewsPost> savedPosts = new ArrayList<>();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(source.url()))
                    .timeout(java.time.Duration.ofSeconds(15))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36 InsightShop-NewsBot/1.0")
                    .header("Accept", "application/rss+xml, application/xml, text/xml, text/html, */*")
                    .GET()
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            String body = response.body();

            log.info("========== RSS DEBUG ==========");
            log.info("Nguồn: {}", source.name());
            log.info("URL: {}", source.url());
            log.info("HTTP status: {}", response.statusCode());
            log.info("Body length: {}", body == null ? 0 : body.length());

            if (body != null && !body.isBlank()) {
                String preview = body.replaceAll("\\s+", " ").trim();
                log.info("Body preview: {}", preview.substring(0, Math.min(220, preview.length())));
            }

            if (response.statusCode() < 200 || response.statusCode() >= 300 || body == null || body.isBlank()) {
                log.warn("Nguồn RSS {} không hợp lệ, status={}", source.name(), response.statusCode());
                return savedPosts;
            }

            Document document = parseXmlSafe(body, source.name());
            if (document == null) {
                log.warn("Nguồn RSS {} parse XML thất bại", source.name());
                return savedPosts;
            }

            NodeList items = document.getElementsByTagName("item");
            log.info("RSS {} có {} item", source.name(), items.getLength());

            if (items.getLength() == 0) {
                log.warn("Nguồn RSS {} không có thẻ <item>. Có thể nguồn trả HTML hoặc đổi cấu trúc RSS.", source.name());
                return savedPosts;
            }

            for (int i = 0; i < items.getLength() && savedPosts.size() < EXTERNAL_LIMIT_PER_SOURCE; i++) {
                try {
                    Element item = (Element) items.item(i);

                    String rawTitle = firstNonBlank(
                            getText(item, "title"),
                            getText(item, "media:title")
                    );

                    String rawLink = firstNonBlank(
                            getText(item, "link"),
                            getText(item, "guid")
                    );

                    String description = firstNonBlank(
                            getText(item, "description"),
                            getText(item, "content:encoded")
                    );

                    String pubDate = firstNonBlank(
                            getText(item, "pubDate"),
                            getText(item, "published"),
                            getText(item, "updated")
                    );

                    String title = limitText(cleanText(rawTitle), MAX_TITLE_LENGTH);
                    String link = normalizeUrl(limitText(cleanText(rawLink), MAX_URL_LENGTH));

                    if (title.isBlank()) {
                        log.warn("Bỏ qua tin RSS từ nguồn {} vì thiếu title", source.name());
                        continue;
                    }

                    if (link.isBlank() || !link.startsWith("http")) {
                        log.warn("Bỏ qua tin RSS '{}' từ nguồn {} vì link không hợp lệ: {}", title, source.name(), link);
                        continue;
                    }

                    if (newsPostRepository.existsBySourceUrlIgnoreCase(link)) {
                        log.info("Bỏ qua tin đã tồn tại: {}", link);
                        continue;
                    }

                    String summary = limitText(stripHtml(description), MAX_SUMMARY_LENGTH);
                    String thumbnail = limitText(firstNonBlank(
                            extractImage(description),
                            extractMediaThumbnail(item),
                            extractEnclosureImage(item)
                    ), MAX_URL_LENGTH);
                    String sourceName = limitText(source.name(), MAX_SOURCE_NAME_LENGTH);

                    NewsPost post = NewsPost.builder()
                            .title(title)
                            .slug(buildUniquePostSlug(title, null))
                            .summary(summary)
                            .content(buildExternalContent(description, link, sourceName))
                            .thumbnail(blankToNull(thumbnail))
                            .status(NewsPostStatus.PUBLISHED)
                            .sourceType(NewsPostSourceType.EXTERNAL)
                            .sourceName(sourceName)
                            .sourceUrl(link)
                            .originalUrl(link)
                            .featured(false)
                            .viewCount(0L)
                            .topic(topic)
                            .author(externalAuthor)
                            .publishedAt(parsePublishedAt(pubDate))
                            .syncedAt(LocalDateTime.now())
                            .build();

                    NewsPost saved = newsPostRepository.save(post);
                    savedPosts.add(saved);

                    log.info("Đã lưu tin RSS: [{}] {}", source.name(), title);
                } catch (Exception itemError) {
                    log.warn("Bỏ qua một tin RSS lỗi từ nguồn {}: {}", source.name(), itemError.getMessage(), itemError);
                }
            }

            log.info("Nguồn {} lưu mới {} tin", source.name(), savedPosts.size());
        } catch (Exception sourceError) {
            log.warn("Không đọc được nguồn RSS {}: {}", source.name(), sourceError.getMessage(), sourceError);
        }

        return savedPosts;
    }

    private Document parseXmlSafe(String xml, String sourceName) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            try {
                factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
                factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            } catch (Exception featureError) {
                log.debug("XML parser không hỗ trợ một số security feature khi đọc RSS {}", sourceName);
            }
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
        } catch (Exception e) {
            log.warn("Không parse được XML RSS từ nguồn {}", sourceName, e);
            return null;
        }
    }

    private User resolveExternalNewsAuthor() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null
                    && authentication.isAuthenticated()
                    && authentication.getName() != null
                    && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
                return userRepository.findByEmailIgnoreCase(authentication.getName())
                        .orElseGet(this::findAdminOrCreateNewsBot);
            }
        } catch (Exception ignored) {
            // Khi hệ thống tự đồng bộ tin ở public page có thể không có authentication.
        }

        return findAdminOrCreateNewsBot();
    }

    private User findAdminOrCreateNewsBot() {
        List<User> superAdmins = userRepository.findByRole(RoleName.SUPER_ADMIN);
        if (!superAdmins.isEmpty()) {
            return superAdmins.get(0);
        }

        List<User> admins = userRepository.findByRole(RoleName.ADMIN);
        if (!admins.isEmpty()) {
            return admins.get(0);
        }

        return userRepository.findByEmailIgnoreCase(EXTERNAL_NEWS_BOT_EMAIL)
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName(EXTERNAL_NEWS_BOT_NAME)
                        .email(EXTERNAL_NEWS_BOT_EMAIL)
                        .passwordHash("SYSTEM_NEWS_BOT_NO_LOGIN")
                        .role(RoleName.ADMIN)
                        .active(false)
                        .deleted(false)
                        .authProvider("SYSTEM")
                        .build()));
    }

    private NewsTopic getOrCreateExternalTechnologyTopic() {
        return newsTopicRepository.findBySlugIgnoreCase(EXTERNAL_TOPIC_SLUG)
                .orElseGet(() -> newsTopicRepository.save(NewsTopic.builder()
                        .name(EXTERNAL_TOPIC_NAME)
                        .slug(EXTERNAL_TOPIC_SLUG)
                        .description("Tin công nghệ tự động từ các nguồn RSS Việt Nam")
                        .active(true)
                        .displayOrder(999)
                        .build()));
    }

    private String getText(Element item, String tagName) {
        NodeList nodes = item.getElementsByTagName(tagName);
        return nodes.getLength() > 0 ? nodes.item(0).getTextContent().trim() : "";
    }

    private String buildExternalContent(String description, String link, String sourceName) {
        String summary = stripHtml(description);
        return "<p>" + escapeHtml(summary) + "</p>"
                + "<p><strong>Nguồn:</strong> " + escapeHtml(sourceName) + "</p>"
                + "<p>Bài viết này được hệ thống đồng bộ từ nguồn RSS. Để xem đầy đủ nội dung, vui lòng đọc tại bài gốc.</p>"
                + "<p><a href=\"" + escapeHtml(link) + "\" target=\"_blank\" rel=\"noopener noreferrer\">Đọc bài gốc</a></p>";
    }

    private String extractImage(String html) {
        if (html == null) return null;
        Matcher matcher = Pattern.compile("<img[^>]+src=[\\\"']([^\\\"']+)[\\\"']", Pattern.CASE_INSENSITIVE).matcher(html);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String extractMediaThumbnail(Element item) {
        NodeList nodes = item.getElementsByTagName("media:thumbnail");
        if (nodes.getLength() == 0) {
            nodes = item.getElementsByTagName("thumbnail");
        }
        if (nodes.getLength() == 0) return null;

        Element element = (Element) nodes.item(0);
        return element.hasAttribute("url") ? element.getAttribute("url") : null;
    }

    private String extractEnclosureImage(Element item) {
        NodeList nodes = item.getElementsByTagName("enclosure");
        for (int i = 0; i < nodes.getLength(); i++) {
            Element element = (Element) nodes.item(i);
            String type = element.getAttribute("type");
            String url = element.getAttribute("url");
            if (url != null && !url.isBlank() && type != null && type.toLowerCase(Locale.ROOT).startsWith("image/")) {
                return url;
            }
        }
        return null;
    }

    private String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String normalizeUrl(String value) {
        if (value == null) return "";
        String url = value.trim();

        int spaceIndex = url.indexOf(" ");
        if (spaceIndex > 0) {
            url = url.substring(0, spaceIndex);
        }

        if (url.startsWith("//")) {
            return "https:" + url;
        }

        return url;
    }

    private String stripHtml(String value) {
        if (value == null) return "";
        return cleanText(value.replaceAll("<[^>]*>", " "));
    }

    private String cleanText(String value) {
        if (value == null) return "";
        return value.replace("<![CDATA[", "").replace("]]>", "")
                .replace("&nbsp;", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String limitText(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value;
        return value.substring(0, maxLength).trim() + "...";
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private LocalDateTime parsePublishedAt(String pubDate) {
        if (pubDate == null || pubDate.isBlank()) return LocalDateTime.now();
        try {
            return ZonedDateTime.parse(pubDate, DateTimeFormatter.RFC_1123_DATE_TIME.withLocale(Locale.ENGLISH)).toLocalDateTime();
        } catch (Exception ignored) {
            return LocalDateTime.now();
        }
    }

    private NewsPostSourceType parseSourceType(String sourceType) {
        String value = blankToNull(sourceType);
        if (value == null || value.equalsIgnoreCase("ALL")) return null;
        return NewsPostSourceType.valueOf(value.toUpperCase());
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
