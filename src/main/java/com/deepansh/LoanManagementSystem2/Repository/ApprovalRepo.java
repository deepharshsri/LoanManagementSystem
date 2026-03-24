package com.deepansh.LoanManagementSystem2.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;

@Repository

public interface ApprovalRepo extends JpaRepository<ApprovalWorkflow,Long>{


    
}
