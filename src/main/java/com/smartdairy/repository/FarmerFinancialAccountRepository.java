package com.smartdairy.repository;

import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmerFinancialAccountRepository extends JpaRepository<FarmerFinancialAccount, Long> {

    Optional<FarmerFinancialAccount> findByAdminAndFarmer(User admin, Farmer farmer);

    boolean existsByAdminAndFarmer(User admin, Farmer farmer);

    List<FarmerFinancialAccount> findByAdmin(User admin);

    @Query("SELECT SUM(f.pendingAdvance) FROM FarmerFinancialAccount f WHERE f.admin = :admin")
    BigDecimal sumPendingAdvanceByAdmin(@Param("admin") User admin);

    @Query("SELECT SUM(f.pendingLoan) FROM FarmerFinancialAccount f WHERE f.admin = :admin")
    BigDecimal sumPendingLoanByAdmin(@Param("admin") User admin);

    @Query("SELECT SUM(f.pendingOther) FROM FarmerFinancialAccount f WHERE f.admin = :admin")
    BigDecimal sumPendingOtherByAdmin(@Param("admin") User admin);

    @Query("SELECT COUNT(f) FROM FarmerFinancialAccount f WHERE f.admin = :admin AND (f.pendingAdvance > 0 OR f.pendingLoan > 0 OR f.pendingOther > 0)")
    Long countFarmersWithPendingBalances(@Param("admin") User admin);

    @Query("SELECT f FROM FarmerFinancialAccount f WHERE f.admin = :admin AND (f.pendingAdvance > 0 OR f.pendingLoan > 0 OR f.pendingOther > 0)")
    List<FarmerFinancialAccount> findFarmersWithPendingBalances(@Param("admin") User admin);

    @Query("SELECT f FROM FarmerFinancialAccount f WHERE f.admin = :admin AND f.farmer.id = :farmerId")
    Optional<FarmerFinancialAccount> findByAdminAndFarmerId(@Param("admin") User admin, @Param("farmerId") Long farmerId);

    @Query("SELECT f FROM FarmerFinancialAccount f WHERE f.admin = :admin AND f.pendingAdvance > 0")
    List<FarmerFinancialAccount> findByAdminWithPendingAdvance(@Param("admin") User admin);

    @Query("SELECT f FROM FarmerFinancialAccount f WHERE f.admin = :admin AND f.pendingLoan > 0")
    List<FarmerFinancialAccount> findByAdminWithPendingLoan(@Param("admin") User admin);

    @Query("SELECT f FROM FarmerFinancialAccount f WHERE f.admin = :admin AND f.pendingOther > 0")
    List<FarmerFinancialAccount> findByAdminWithPendingOther(@Param("admin") User admin);
}
