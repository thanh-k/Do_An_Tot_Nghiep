package com.ecommerce.modules.behavior.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BehaviorTrackResponse {
    private Boolean tracked;
    private String message;
}
