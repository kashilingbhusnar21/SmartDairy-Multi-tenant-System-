package com.smartdairy.repository;

import com.smartdairy.entity.Payment;
import com.smartdairy.entity.Payment.PaymentStatus;
import com.smartdairy.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("select p from Payment p join fetch p.farmer join fetch p.milkCollection where p.id = :id")
    Optional<Payment> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            select p from Payment p
            join fetch p.farmer
            join fetch p.milkCollection
            where p.admin = :admin and p.id = :id
            """)
    Optional<Payment> findByAdminAndIdWithDetails(@Param("admin") User admin, @Param("id") Long id);

    Optional<Payment> findByAdminAndMilkCollection_Id(User admin, Long milkCollectionId);

    Optional<Payment> findByAdminAndId(User admin, Long id);

    List<Payment> findByAdmin(User admin);

    List<Payment> findByAdminAndStatus(User admin, PaymentStatus status);

    List<Payment> findByAdminAndFarmer_IdOrderByCreatedAtDesc(User admin, Long farmerId);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.admin = :admin and p.status = :status")
    BigDecimal sumAmountByAdminAndStatus(@Param("admin") User admin, @Param("status") PaymentStatus status);

    @Query("select count(p) from Payment p where p.admin = :admin and p.status = :status")
    long countByAdminAndStatus(@Param("admin") User admin, @Param("status") PaymentStatus status);

    @Query("""
            select coalesce(sum(p.amount), 0) from Payment p
            where p.admin = :admin and p.status = :status and p.paymentDate between :from and :to
            """)
    BigDecimal sumAmountByAdminAndStatusAndPaymentDateBetween(
            @Param("admin") User admin,
            @Param("status") PaymentStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            select count(p) from Payment p
            where p.admin = :admin and p.status = :status and p.paymentDate between :from and :to
            """)
    long countByAdminAndStatusAndPaymentDateBetween(
            @Param("admin") User admin,
            @Param("status") PaymentStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            select p.paymentDate, coalesce(sum(p.amount), 0) from Payment p
            where p.admin = :admin and p.status = :status and p.paymentDate between :from and :to
            group by p.paymentDate order by p.paymentDate
            """)
    List<Object[]> sumPaidAmountGroupedByPaymentDateForAdmin(
            @Param("admin") User admin,
            @Param("status") PaymentStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("select p from Payment p join fetch p.farmer f join fetch f.admin")
    List<Payment> findAllWithFarmer();
}
