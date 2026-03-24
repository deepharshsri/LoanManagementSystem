package com.deepansh.LoanManagementSystem2.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.User;

import java.util.List;

@Repository
public interface LoanRepo  extends  JpaRepository<Loan,Long>{

    public List<Loan> findByUser(User user);
    
}
