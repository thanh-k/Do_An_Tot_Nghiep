package com.ecommerce.modules.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.ecommerce.entity.OrderDetail;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
    // Dùng dấu gạch dưới "_" để JPA hiểu là tìm thuộc tính "Id" bên trong Object
    // "variant"
    // Lưu ý: Nếu trong OrderDetail.java của bạn tên biến là productVariant thì sửa
    // thành existsByProductVariant_Id
    boolean existsByProductVariant_Id(Long variantId);
}
