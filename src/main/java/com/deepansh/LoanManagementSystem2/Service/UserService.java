package com.deepansh.LoanManagementSystem2.Service;

import com.deepansh.LoanManagementSystem2.Service.LoanService;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.ApprovalRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

@Service
public class UserService {
    
    @Autowired  
    private UserRepository userRepository;     

    @Autowired
    LoanService loanService;

    public List<Loan> getAllLoans(Long userId){
        Optional<User> userExist=userRepository.findById(userId);

        return userExist.map(user->{
            return user.getLoans();
        }
        ).orElseThrow(()->  new RuntimeException("userId Not found"));    
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }

    public User findByUserName(String username) {
       return userRepository.findByUsername(username);
   }
   
    public void deleteUser(Long userId){
        userRepository.deleteById(userId);
    }
    
    public Loan applyLoan(Long userId,Long loanTypeId,int amount    ){
        return loanService.requestLoan(userId, loanTypeId, amount);
    }
    
 

    
}
