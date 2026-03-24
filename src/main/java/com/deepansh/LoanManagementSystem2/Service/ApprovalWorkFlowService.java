package com.deepansh.LoanManagementSystem2.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Repository.ApprovalRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;

@Service
public class ApprovalWorkFlowService {
  
    @Autowired
    LoanRepo loanRepo;
    @Autowired  
    ApprovalRepo approvalRepo;

    public ApprovalWorkflow createWorkFlow(Long loanId){
      
        Optional<Loan> loanExist=loanRepo.findById(loanId); 
        ApprovalWorkflow approvalWorkflow=ApprovalWorkflow.builder()
        .stage("Maker")
        .loan(loanExist.get())
        .status("Under Consideration")
        .build();
        
     return approvalRepo.save(approvalWorkflow);
    }
    
    public ApprovalWorkflow updateWorkFlow(Long workFlowId,String status,String comments){
        ApprovalWorkflow approvalWorkflow=approvalRepo.findById(workFlowId).get();
        approvalWorkflow.setStatus(status);
        approvalWorkflow.setComments(comments);
        return approvalRepo.save(approvalWorkflow);
    }
    
    // audit function need to written like fetch all pending approvals.

    public List<ApprovalWorkflow> getPendingApprovals(){
        return approvalRepo.findAllPendingApprovals();
    }
    
    public List<ApprovalWorkflow> approvedApprovals(){
        return approvalRepo.findAllByStatus("Approved");
    }
}
