package com.ecommerce.modules.livestream.repository.mongo;

import com.ecommerce.modules.livestream.document.LivestreamChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LivestreamChatMessageRepository extends MongoRepository<LivestreamChatMessage, String> {
    List<LivestreamChatMessage> findTop80ByLivestreamIdOrderByCreatedAtDesc(Long livestreamId);
    void deleteByLivestreamId(Long livestreamId);
}
