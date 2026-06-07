package com.ecommerce.modules.behavior.service;

import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorEventResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorInterestResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorSummaryResponse;
import com.ecommerce.modules.behavior.dto.admin.AdminBehaviorProductReportResponse;
import com.ecommerce.modules.behavior.entity.BehaviorEventType;

import java.time.LocalDate;
import java.util.List;

public interface AdminBehaviorService {
    AdminBehaviorSummaryResponse getSummary();

    List<AdminBehaviorEventResponse> getEvents(BehaviorEventType eventType,
                                               String keyword,
                                               String userKeyword,
                                               String productKeyword,
                                               LocalDate fromDate,
                                               LocalDate toDate,
                                               int limit);

    List<AdminBehaviorInterestResponse> getInterests(String keyword,
                                                     String userKeyword,
                                                     String productKeyword,
                                                     int limit);

    AdminBehaviorProductReportResponse getProductReport(LocalDate fromDate,
                                                        LocalDate toDate,
                                                        int limit);

    byte[] exportProductReportExcel(LocalDate fromDate,
                                    LocalDate toDate,
                                    int limit);
}
