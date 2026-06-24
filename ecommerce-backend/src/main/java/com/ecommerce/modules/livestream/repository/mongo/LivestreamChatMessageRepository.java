package com.ecommerce.modules.livestream.repository.mongo;

import com.ecommerce.modules.livestream.document.LivestreamChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LivestreamChatMessageRepository extends MongoRepository<LivestreamChatMessage, String> {
    List<LivestreamChatMessage> findTop80ByLivestreamIdOrderByCreatedAtDesc(Long livestreamId);
    List<LivestreamChatMessage> findByLivestreamIdAndPinnedTrueOrderByPinnedAtDesc(Long livestreamId);
    List<LivestreamChatMessage> findByLivestreamIdAndPinnedTrueAndPinExpiresAtBefore(Long livestreamId, LocalDateTime now);
    Optional<LivestreamChatMessage> findByIdAndLivestreamId(String id, Long livestreamId);
    void deleteByLivestreamId(Long livestreamId);
}
