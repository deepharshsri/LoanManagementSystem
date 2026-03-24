package com.deepansh.LoanManagementSystem2.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.Loan;

@Repository
public interface LoanRepo  extends  JpaRepository<Loan,Long>{
    
}
