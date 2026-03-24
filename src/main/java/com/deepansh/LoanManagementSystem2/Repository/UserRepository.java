package com.deepansh.LoanManagementSystem2.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.User;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {

    public User findByUsername(String username);

}
