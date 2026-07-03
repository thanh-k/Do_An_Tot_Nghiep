package com.ecommerce.modules.livestream.config;

import com.ecommerce.modules.livestream.websocket.LivestreamSignalingHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class LivestreamWebSocketConfig implements WebSocketConfigurer {
    private final LivestreamSignalingHandler livestreamSignalingHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(livestreamSignalingHandler, "/ws/livestream/{id}")
                .setAllowedOriginPatterns("http://localhost:*", "https://hitcinsight.id.vn", "https://*.hitcinsight.id.vn");
    }
}
