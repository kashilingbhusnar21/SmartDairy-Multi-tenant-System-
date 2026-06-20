package com.smartdairy.repository;

import com.smartdairy.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPasswordResetToken(String passwordResetToken);

    boolean existsByEmail(String email);

    @Query("select u from User u join fetch u.role")
    List<User> findAllWithRole();
}
