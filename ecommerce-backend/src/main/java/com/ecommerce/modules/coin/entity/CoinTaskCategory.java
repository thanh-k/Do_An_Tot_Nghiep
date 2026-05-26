package com.ecommerce.modules.coin.entity;

public enum CoinTaskCategory {
    DAILY_LOGIN,
    ONLINE_DURATION,
    REVIEW_NO_IMAGE,
    REVIEW_WITH_IMAGE,

    // Giữ tương thích dữ liệu cũ nếu database đã từng lưu DAILY/REVIEW
    DAILY,
    REVIEW
}
