package com.deepansh.LoanManagementSystem2.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.User;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {

    public User findByUsername(String username);
    
    @Query("SELECT u.name FROM User u WHERE u.username=:username")
    public String findNameByUsername(String username);


    

}
