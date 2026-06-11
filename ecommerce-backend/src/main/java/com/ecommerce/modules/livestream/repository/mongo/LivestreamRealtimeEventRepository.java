package com.ecommerce.modules.livestream.repository.mongo;

import com.ecommerce.modules.livestream.document.LivestreamRealtimeEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LivestreamRealtimeEventRepository extends MongoRepository<LivestreamRealtimeEvent, String> {
    List<LivestreamRealtimeEvent> findTop50ByLivestreamIdOrderByCreatedAtDesc(Long livestreamId);
}
