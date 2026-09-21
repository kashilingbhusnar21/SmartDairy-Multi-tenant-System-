package com.smartdairy.repository;

import com.smartdairy.entity.Vendor;
import com.smartdairy.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    List<Vendor> findByAdmin(User admin);

    List<Vendor> findByAdminOrderByNameAsc(User admin);

    Optional<Vendor> findByIdAndAdmin(Long id, User admin);

    @Query("""
            select v from Vendor v
            join fetch v.admin
            where v.id = :id
              and v.admin.id = :adminId
            """)
    Optional<Vendor> findByIdAndAdminIdWithAdmin(
            @Param("id") Long id, @Param("adminId") Long adminId);

    boolean existsByIdAndAdmin(Long id, User admin);

    long countByAdmin(User admin);

    boolean existsByAdminAndPhone(User admin, String phone);

    @Query("""
            select v from Vendor v
            where v.admin = :admin
              and (lower(v.name) like lower(concat('%', :query, '%'))
                   or cast(v.id as string) like concat('%', :query, '%'))
            order by v.name
            """)
    List<Vendor> searchByAdmin(@Param("admin") User admin, @Param("query") String query);

    List<Vendor> findByAdminAndActiveOrderByNameAsc(User admin, boolean active);

    @Query("""
            select v from Vendor v
            where v.admin = :admin
              and v.active = :active
              and (lower(v.name) like lower(concat('%', :query, '%'))
                   or cast(v.id as string) like concat('%', :query, '%'))
            order by v.name
            """)
    List<Vendor> searchByAdminAndActive(@Param("admin") User admin, @Param("active") boolean active, @Param("query") String query);
}
