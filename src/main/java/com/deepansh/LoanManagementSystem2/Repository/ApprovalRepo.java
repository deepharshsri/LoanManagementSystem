package com.deepansh.LoanManagementSystem2.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;

@Repository

public interface ApprovalRepo extends JpaRepository<ApprovalWorkflow,Long>{

@Query("SELECT a FROM ApprovalWorkflow a WHERE a.status = 'Under Consideration'")
List<ApprovalWorkflow> findAllPendingApprovals();

@Query("SELECT a FROM ApprovalWorkflow a WHERE a.status = 'Approved'")
List<ApprovalWorkflow> findAllByStatus(String status);
    
}
