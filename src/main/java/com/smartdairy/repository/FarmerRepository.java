package com.smartdairy.repository;

import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {

    List<Farmer> findByAdmin(User admin);

    List<Farmer> findByAdminOrderByFullNameAsc(User admin);

    Optional<Farmer> findByIdAndAdmin(Long id, User admin);

    @Query("""
            select f from Farmer f
            where f.id = :id
              and f.admin = :admin
            """)
    Optional<Farmer> findLookupByIdAndAdmin(@Param("id") Long id, @Param("admin") User admin);

    boolean existsByIdAndAdmin(Long id, User admin);

    long countByAdmin(User admin);

    boolean existsByAdminAndAadhaarNumber(User admin, String aadhaarNumber);

    @Query("""
            select f from Farmer f
            where f.admin = :admin
              and (lower(f.fullName) like lower(concat('%', :query, '%'))
                   or lower(f.village) like lower(concat('%', :query, '%'))
                   or cast(f.id as string) like concat('%', :query, '%'))
            order by f.fullName
            """)
    List<Farmer> searchByAdmin(@Param("admin") User admin, @Param("query") String query);
}
