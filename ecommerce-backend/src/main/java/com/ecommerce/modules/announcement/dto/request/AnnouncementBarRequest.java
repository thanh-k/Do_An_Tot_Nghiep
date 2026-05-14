package com.ecommerce.modules.announcement.dto.request;

import lombok.Data;

@Data
public class AnnouncementBarRequest {
    private String message;
    private Boolean active;
    private String backgroundColor;
    private String textColor;
    private Integer speedSeconds;
    private Integer sortOrder;
}
