package com.smartdairy.repository;

import com.smartdairy.entity.Doctor;
import com.smartdairy.entity.DoctorRating;
import com.smartdairy.entity.Farmer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorRatingRepository extends JpaRepository<DoctorRating, Long> {

    List<DoctorRating> findByDoctor(Doctor doctor);

    List<DoctorRating> findByDoctorOrderByCreatedAtDesc(Doctor doctor);

    Optional<DoctorRating> findByDoctorAndFarmer(Doctor doctor, Farmer farmer);

    List<DoctorRating> findByFarmer(Farmer farmer);

    List<DoctorRating> findByFarmerOrderByCreatedAtDesc(Farmer farmer);

    @Query("""
            select dr from DoctorRating dr
            where dr.doctor.id = :doctorId
              and dr.doctor.admin.id = :adminId
            """)
    List<DoctorRating> findByDoctorIdAndAdminId(@Param("doctorId") Long doctorId, @Param("adminId") Long adminId);

    @Query("""
            select avg(dr.rating) from DoctorRating dr
            where dr.doctor = :doctor
            """)
    Double getAverageRatingByDoctor(@Param("doctor") Doctor doctor);

    @Query("""
            select count(dr) from DoctorRating dr
            where dr.doctor = :doctor
            """)
    long countByDoctor(@Param("doctor") Doctor doctor);

    @Query("""
            select dr from DoctorRating dr
            where dr.doctor.id = :doctorId
              and dr.doctor.admin.id = :adminId
            order by dr.createdAt desc
            """)
    List<DoctorRating> findByDoctorIdAndAdminIdOrderByCreatedAtDesc(
            @Param("doctorId") Long doctorId, @Param("adminId") Long adminId);
}
