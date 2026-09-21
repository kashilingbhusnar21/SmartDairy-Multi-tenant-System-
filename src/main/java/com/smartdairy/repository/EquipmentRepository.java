package com.smartdairy.repository;

import com.smartdairy.entity.Equipment;
import com.smartdairy.entity.User;
import com.smartdairy.entity.Vendor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    List<Equipment> findByVendor(Vendor vendor);

    List<Equipment> findByVendorAndActiveOrderByNameAsc(Vendor vendor, boolean active);

    Optional<Equipment> findByIdAndAdmin(Long id, User admin);

    Optional<Equipment> findByIdAndVendor(Long id, Vendor vendor);

    @Query("""
            select e from Equipment e
            join fetch e.vendor
            join fetch e.admin
            where e.id = :id
              and e.admin.id = :adminId
            """)
    Optional<Equipment> findByIdAndAdminIdWithVendorAndAdmin(
            @Param("id") Long id, @Param("adminId") Long adminId);

    @Query("""
            select e from Equipment e
            join fetch e.vendor
            where e.vendor.id = :vendorId
              and e.admin.id = :adminId
              and e.active = true
            order by e.name
            """)
    List<Equipment> findByVendorIdAndAdminIdWithVendor(
            @Param("vendorId") Long vendorId, @Param("adminId") Long adminId);

    @Query("""
            select e from Equipment e
            where e.admin = :admin
              and (lower(e.name) like lower(concat('%', :query, '%'))
                   or cast(e.id as string) like concat('%', :query, '%'))
            order by e.name
            """)
    List<Equipment> searchByAdmin(@Param("admin") User admin, @Param("query") String query);

    List<Equipment> findByAdminOrderByNameAsc(User admin);

    List<Equipment> findByAdminAndActiveOrderByNameAsc(User admin, boolean active);

    @Query("""
            select e from Equipment e
            where e.admin = :admin
              and e.active = :active
              and (lower(e.name) like lower(concat('%', :query, '%'))
                   or cast(e.id as string) like concat('%', :query, '%'))
            order by e.name
            """)
    List<Equipment> searchByAdminAndActive(@Param("admin") User admin, @Param("active") boolean active, @Param("query") String query);
}
