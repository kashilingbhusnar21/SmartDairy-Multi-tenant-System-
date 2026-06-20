package com.smartdairy.repository;

import com.smartdairy.entity.FeedPurchase;
import com.smartdairy.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FeedPurchaseRepository extends JpaRepository<FeedPurchase, Long> {

    List<FeedPurchase> findByAdmin(User admin);

    List<FeedPurchase> findByAdminAndFarmer_IdOrderByFeedDateDescCreatedAtDesc(User admin, Long farmerId);

    List<FeedPurchase> findByAdminAndFeedDateBetweenOrderByFeedDateDescCreatedAtDesc(
            User admin, LocalDate from, LocalDate to);

    @Query("""
            select f from FeedPurchase f
            where f.admin = :admin and f.farmer.id = :farmerId and f.remainingAmount > 0
            order by f.feedDate, f.createdAt
            """)
    List<FeedPurchase> findOutstandingByAdminAndFarmer(@Param("admin") User admin, @Param("farmerId") Long farmerId);

    @Query("""
            select coalesce(sum(f.remainingAmount), 0) from FeedPurchase f
            where f.admin = :admin and f.farmer.id = :farmerId
            """)
    BigDecimal sumOutstandingByAdminAndFarmer(@Param("admin") User admin, @Param("farmerId") Long farmerId);

    @Query("select coalesce(sum(f.remainingAmount), 0) from FeedPurchase f where f.admin = :admin")
    BigDecimal sumOutstandingByAdmin(@Param("admin") User admin);

    @Query("select count(f) from FeedPurchase f where f.admin = :admin and f.feedDate between :from and :to")
    long countByAdminAndFeedDateBetween(@Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select coalesce(sum(f.feedQuantity), 0) from FeedPurchase f
            where f.admin = :admin and f.feedDate between :from and :to
            """)
    BigDecimal sumQuantityByAdminAndFeedDateBetween(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select coalesce(sum(f.totalAmount), 0) from FeedPurchase f
            where f.admin = :admin and f.feedDate between :from and :to
            """)
    BigDecimal sumTotalAmountByAdminAndFeedDateBetween(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select coalesce(sum(f.remainingAmount), 0) from FeedPurchase f
            where f.admin = :admin and f.feedDate between :from and :to
            """)
    BigDecimal sumOutstandingByAdminAndFeedDateBetween(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select coalesce(sum(f.totalAmount), 0) from FeedPurchase f
            where f.admin = :admin and f.feedDate between :from and :to and f.farmer.id = :farmerId
            """)
    BigDecimal sumTotalAmountBetweenForAdminAndFarmer(
            @Param("admin") User admin,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("farmerId") Long farmerId);

    @Query("""
            select coalesce(sum(f.totalAmount), 0) from FeedPurchase f
            where f.admin = :admin and f.feedDate between :from and :to
            """)
    BigDecimal sumTotalAmountBetweenForAdmin(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select f.feedDate, coalesce(sum(f.totalAmount), 0) from FeedPurchase f
            where f.admin = :admin and f.feedDate between :from and :to
            group by f.feedDate order by f.feedDate
            """)
    List<Object[]> sumAmountGroupedByDateForAdmin(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select f from FeedPurchase f join fetch f.farmer farmer join fetch farmer.admin")
    List<FeedPurchase> findAllWithFarmer();
}
