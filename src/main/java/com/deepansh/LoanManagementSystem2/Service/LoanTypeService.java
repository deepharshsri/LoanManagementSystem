package com.deepansh.LoanManagementSystem2.Service;

import java.lang.StackWalker.Option;
import java.util.List;
import java.util.Optional;

import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Repository.LoanTypeRepo;

@Service
public class LoanTypeService {
    
    @Autowired
    LoanTypeRepo loanTypeRepo;

    public List<LoanType> getLoanTypes(){
        
        return loanTypeRepo.findAll();
    }

    public void addLoantype(LoanType loanType) {
        // TODO Auto-generated method stub
         loanTypeRepo.save(loanType);    
    }

    public LoanType  updateLoanTypePartially(LoanType loanType) {
        
        Optional<LoanType> loanTypeOptional=loanTypeRepo.findById(loanType.getId());
        return loanTypeOptional.map((loan)->{

            Optional.ofNullable( loanType.getDescription()).ifPresent(des->loan.setDescription(des));
            Optional.ofNullable(loanType.getTenure()).ifPresent(tenure->loan.setTenure(tenure));            
            Optional.ofNullable(loanType.getInterestRate()).ifPresent(ir->loan.setInterestRate(ir));
            Optional.ofNullable(loanType.getMaxAmount()).ifPresent(ma->loan.setMaxAmount(ma));            
            Optional.ofNullable(loanType.getMinAmount()).ifPresent(ma->loan.setMinAmount(ma));
            return loanTypeRepo.save(loan);
        } 
    ).orElseThrow((()->new RuntimeException("loan type not found")));

}
}