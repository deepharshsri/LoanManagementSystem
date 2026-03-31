package com.deepansh.LoanManagementSystem2.Service;

import com.deepansh.LoanManagementSystem2.Repository.CibilRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;
import com.deepansh.LoanManagementSystem2.Service.LoanService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.print.Doc;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;
import com.deepansh.LoanManagementSystem2.Entity.Document;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.ApprovalRepo;
import com.deepansh.LoanManagementSystem2.Repository.DocumentRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

@Service
public class UserService {
    

    
    @Autowired  
    private UserRepository userRepository;     

    @Autowired
    LoanService loanService;

    @Autowired
    DocumentRepo documentRepo;

    @Autowired
    CibilRepo cibilRepo;

    @Autowired
    LoanRepo loanRepo;

    public List<Loan> getAllLoans(String username){
       
       User user= userRepository.findByUsername(username);

       String pan=documentRepo.findDocumentNumberByUserIdAndType(user.getId(),"pan");
    //    System.out.println("documents: "+documents.get(0));
    // System.out.println("pan: "+pan);
  
       int score=cibilRepo.findScoreByPan(pan);;
  
       
       List<Loan> loans = loanService.getAllLoans(user.getId());

       for (Loan loan : loans) {
        loan.setScore(score);
       }

       loanRepo.saveAll(loans);

       return loans;
      
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

    public boolean verifyKYC(String username, Map<String,String> request) {
     User user = userRepository.findByUsername(username);
     List<Document> documents= documentRepo.findAllByUserId(user.getId());
        Map<String,String> map = new HashMap<>();
        for(Document document: documents){
            map.put(document.getDocumentType(), document.getDocumentNumber());
        }
    
     System.out.println("map: "+map);
     System.out.println("request: "+request);
     System.out.println("map.get(aadhaar): "+map.get("aadhaar"));
     System.out.println("request.get(aadhaar): "+request.get("aadhaar"));
     System.out.println("map.get(pan): "+map.get("pan"));
     System.out.println("request.get(pan): "+request.get("pan"));
     if(map.get("pan").equals(request.get("pan"))&&
          map.get("aadhaar").equals(request.get("aadhaar"))) return true;
     else return false;
  
    }
 
    
    // public Loan applyLoan(Long userId,Long loanTypeId,int amount    ){
    //     return loanService.requestLoan(userId, loanTypeId, amount);
    // }
    
 

    
}
