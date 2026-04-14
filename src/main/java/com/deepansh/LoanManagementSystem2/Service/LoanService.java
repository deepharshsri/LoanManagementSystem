package com.deepansh.LoanManagementSystem2.Service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.DTO.LoanApplicationDto;
import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.ApprovalRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanTypeRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

import java.time.LocalDateTime;
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

       public Loan requestLoan(Long userId,LoanApplicationDto request){
        System.out.println("Request received for loan application: " + request);
        Optional<User> userExist=userRepository.findById(userId);
        Optional<LoanType> loanType=loanTypeRepository.findById(request.getLoanTypeId()); 
        //  System.out.println("user exist: "+userExist.get());
        if(userExist.isEmpty()){
            throw new RuntimeException("user not found");
        }
        if(loanType.isEmpty()){
            throw new RuntimeException("loan type not found");
        }
        boolean exist = userExist.get().getLoans().stream().anyMatch(loan->loan.getLoanType().getId().equals(request.getLoanTypeId()));
        if(exist){
            // want front end to show error message that loan of this type already exist for the user
            System.out.println("Loan of this type already exists for the user");
            throw new RuntimeException("Loan of this type already exists for the user");
        }
        int score=userExist.get().getCibil().getScore();
        Loan l1=loanType.map(it->{
            return Loan.builder()
            .applicantName(request.getApplicantName())
            .mobile(request.getMobile())
            .appliedAmt(request.getAppliedAmt())
            .pan(request.getPan())
            .dob(request.getDob())
            .income(request.getIncome())
            .employer(request.getEmployer())
            .empType(request.getEmpType())
            .tenure(request.getTenure())
            .eligibleAmount(request.getEligibleAmount())
            .emi(request.getEmi())
            .user(userExist.get())
            .score(score)
            .status("pending")
            .loanType(it)
            .appliedAt(LocalDateTime.now())
            .build();
        }).orElseThrow(()-> new RuntimeException("Loan Type not found"));
    //    approvalWorkFlowService.createWorkFlow(loanTypeId);
        return loanRepo.save(l1);
  
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
    public Loan updateLoanStatus(Long loanId,String role,String username,String status,String rejectReason){
        Loan loan=loanRepo.findById(loanId).get();
        loan.setStatus(status);
        System.out.println("role: "+role+"username:"+username);
        switch (role){
        case "checker" : loan.setCheckedBy(username); loan.setCheckedAt(LocalDateTime.now());break;
        case "maker" :loan.setMakedBy(username); loan.setMakedAt(LocalDateTime.now());break;
        case "authorizer" :loan.setAuthorizedBy(username); loan.setAuthorizedAt(LocalDateTime.now());break;
        }
        if(rejectReason!=null && !rejectReason.isEmpty()) loan.setRejectedReason(rejectReason);
        return loanRepo.save(loan);
    }

    // add disbusement

    
}
