package com.smartdairy.repository;

import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MilkCollectionRepository extends JpaRepository<MilkCollection, Long> {

    List<MilkCollection> findByAdmin(User admin);

    List<MilkCollection> findByAdminAndDateOrderByFarmer_FullNameAscShiftAsc(User admin, LocalDate date);

    List<MilkCollection> findByAdminAndDateBetweenOrderByDateAscFarmer_FullNameAsc(
            User admin, LocalDate from, LocalDate to);

    List<MilkCollection> findByAdminAndFarmer_IdAndDateBetweenOrderByDateAsc(
            User admin, Long farmerId, LocalDate from, LocalDate to);

    List<MilkCollection> findByAdminAndFarmer_Id(User admin, Long farmerId);

    @Query("""
            select m from MilkCollection m
            join fetch m.farmer
            where m.admin = :admin and m.date = :date
            order by m.farmer.fullName, m.shift
            """)
    List<MilkCollection> findByAdminAndDateWithFarmerOrdered(
            @Param("admin") User admin, @Param("date") LocalDate date);

    @Query("""
            select m from MilkCollection m
            join fetch m.farmer
            where m.admin = :admin and m.farmer.id = :farmerId
              and m.date between :from and :to
            order by m.date asc
            """)
    List<MilkCollection> findDetailedForAdminAndFarmerBetween(
            @Param("admin") User admin,
            @Param("farmerId") Long farmerId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("select m from MilkCollection m where m.admin = :admin and m.id = :id")
    Optional<MilkCollection> findByAdminAndId(@Param("admin") User admin, @Param("id") Long id);

    @Query("select count(m) from MilkCollection m where m.admin = :admin and m.date = :date")
    long countByAdminAndDate(@Param("admin") User admin, @Param("date") LocalDate date);

    @Query("select coalesce(sum(m.quantityLiters), 0) from MilkCollection m where m.admin = :admin and m.date = :date")
    BigDecimal sumQuantityByAdminAndDate(@Param("admin") User admin, @Param("date") LocalDate date);

    @Query("select coalesce(sum(m.totalAmount), 0) from MilkCollection m where m.admin = :admin and m.date = :date")
    BigDecimal sumTotalAmountByAdminAndDate(@Param("admin") User admin, @Param("date") LocalDate date);

    @Query("""
            select m.date, coalesce(sum(m.quantityLiters), 0), coalesce(sum(m.totalAmount), 0)
            from MilkCollection m
            where m.admin = :admin and m.date between :from and :to
            group by m.date order by m.date
            """)
    List<Object[]> sumQuantityAndAmountGroupedByDateForAdmin(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select f.id, f.fullName, coalesce(sum(m.quantityLiters), 0) from MilkCollection m
            join m.farmer f
            where m.admin = :admin and m.date between :from and :to
            group by f.id, f.fullName
            order by coalesce(sum(m.quantityLiters), 0) desc
            """)
    List<Object[]> sumQuantityGroupedByFarmerForAdmin(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select coalesce(sum(m.totalAmount), 0) from MilkCollection m
            where m.admin = :admin and m.date between :from and :to
            """)
    BigDecimal sumTotalAmountBetweenForAdmin(
            @Param("admin") User admin, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            select coalesce(sum(m.totalAmount), 0) from MilkCollection m
            where m.admin = :admin and m.date between :from and :to and m.farmer.id = :farmerId
            """)
    BigDecimal sumTotalAmountBetweenForAdminAndFarmer(
            @Param("admin") User admin,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("farmerId") Long farmerId);

    @Query("select mc from MilkCollection mc join fetch mc.farmer f join fetch f.admin")
    List<MilkCollection> findAllWithFarmer();
}
