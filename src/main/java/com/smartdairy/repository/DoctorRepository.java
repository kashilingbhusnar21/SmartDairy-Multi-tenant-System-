package com.smartdairy.repository;

import com.smartdairy.entity.Doctor;
import com.smartdairy.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    List<Doctor> findByAdmin(User admin);

    List<Doctor> findByAdminOrderByFullNameAsc(User admin);

    Optional<Doctor> findByIdAndAdmin(Long id, User admin);

    @Query("""
            select d from Doctor d
            join fetch d.admin
            where d.id = :id
              and d.admin.id = :adminId
            """)
    Optional<Doctor> findByIdAndAdminIdWithAdmin(
            @Param("id") Long id, @Param("adminId") Long adminId);

    boolean existsByIdAndAdmin(Long id, User admin);

    long countByAdmin(User admin);

    boolean existsByAdminAndMobileNumber(User admin, String mobileNumber);

    @Query("""
            select d from Doctor d
            where d.admin = :admin
              and (lower(d.fullName) like lower(concat('%', :query, '%'))
                   or lower(d.specialization) like lower(concat('%', :query, '%'))
                   or cast(d.id as string) like concat('%', :query, '%'))
            order by d.fullName
            """)
    List<Doctor> searchByAdmin(@Param("admin") User admin, @Param("query") String query);

    List<Doctor> findByAdminAndActiveOrderByFullNameAsc(User admin, boolean active);

    @Query("""
            select d from Doctor d
            where d.admin = :admin
              and d.active = :active
              and (lower(d.fullName) like lower(concat('%', :query, '%'))
                   or lower(d.specialization) like lower(concat('%', :query, '%'))
                   or cast(d.id as string) like concat('%', :query, '%'))
            order by d.fullName
            """)
    List<Doctor> searchByAdminAndActive(@Param("admin") User admin, @Param("active") boolean active, @Param("query") String query);
}
