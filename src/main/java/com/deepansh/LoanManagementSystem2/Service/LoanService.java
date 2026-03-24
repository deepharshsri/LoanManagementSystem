package com.deepansh.LoanManagementSystem2.Service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.ApprovalRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanTypeRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

@Service
public class LoanService {
    
       @Autowired
        private UserRepository userRepository;

        @Autowired
        private LoanTypeRepo loanTypeRepository;

        @Autowired
        private LoanRepo loanRepo;

        @Autowired
        private ApprovalRepo approvalWorkFlowRepo;

       public Loan requestLoan(Long userId,Long loanTypeId,int amount){
        Optional<User> userExist=userRepository.findById(userId);
        Optional<LoanType> loanType=loanTypeRepository.findById(loanTypeId);
        Loan loanApplied=Loan.builder()
                             .loanAmount(amount)
                             .loanStatus("Pending")
                             .user(userExist.get())
                             .loanType(loanType.get())
                             .build();
        
        ApprovalWorkflow approvalWorkflow=ApprovalWorkflow.builder()
                                                             .stage("Pending")
                                                             .loan(loanType.get())
                                                             .status("Under Consideration")
                                                             .build();
        approvalWorkFlowRepo.save(approvalWorkflow);
        
        return loanRepo.save(loanApplied);
  
    }
    
}
