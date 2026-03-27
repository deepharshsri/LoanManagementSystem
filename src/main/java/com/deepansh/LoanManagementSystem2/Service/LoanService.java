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
import java.util.List;

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

        @Autowired
        private ApprovalWorkFlowService approvalWorkFlowService;

       public Loan requestLoan(Long userId,String loanTypeId,Long amount){
        Optional<User> userExist=userRepository.findById(userId);
        Optional<LoanType> loanType=loanTypeRepository.findById(loanTypeId);
        Loan loanApplied=Loan.builder()
                             .amount(amount)
                             .status("Pending")
                             .user(userExist.get())
                            //  .loanType(loanType.get())
                             .build();
        
    //    approvalWorkFlowService.createWorkFlow(loanTypeId);
       return loanRepo.save(loanApplied);
  
    }

    public List<Loan> getAllLoans(Long userId){
        Optional<User> user= userRepository.findById(userId);
        return  user.map(user1->{
           return loanRepo.findByUser(user1);
        }).orElseThrow(()->new RuntimeException("user not found") );
       
       
    }
    public Loan findLoanById(Long loanId){
        return loanRepo.findById(loanId).get();
    }
    
    public List<ApprovalWorkflow> getPendingApprovals(){
        return approvalWorkFlowService.getPendingApprovals();
    }
    
    public List<ApprovalWorkflow> getApprovedLoans(){
        return approvalWorkFlowService.approvedApprovals();
    }
     //
     // need to check again who to take update status responsibilty
     //
    public Loan updateLoanStatus(Long loanId,String status){
        Loan loan=loanRepo.findById(loanId).get();
        loan.setStatus(status);
        return loanRepo.save(loan);
    }

    // add disbusement

    
}
