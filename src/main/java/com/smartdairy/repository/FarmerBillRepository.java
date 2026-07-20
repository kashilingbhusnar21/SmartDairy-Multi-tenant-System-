package com.smartdairy.repository;

import com.smartdairy.entity.FarmerBill;
import com.smartdairy.entity.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmerBillRepository extends JpaRepository<FarmerBill, Long> {

    List<FarmerBill> findByAdminAndFarmerIdAndFromDateAndToDate(
            User admin,
            Long farmerId,
            LocalDate fromDate,
            LocalDate toDate
    );
}
