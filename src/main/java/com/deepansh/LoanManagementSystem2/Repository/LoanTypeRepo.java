package com.deepansh.LoanManagementSystem2.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import java.util.List;
import java.util.Optional;


@Repository
public interface LoanTypeRepo extends JpaRepository<LoanType,String>{

    public  Optional<LoanType> findById(String id);
    
}
