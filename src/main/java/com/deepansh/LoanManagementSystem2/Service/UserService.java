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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.DTO.LoanResponseDTo;
import com.deepansh.LoanManagementSystem2.DTO.SignUpDTO;
import com.deepansh.LoanManagementSystem2.Entity.ApprovalWorkflow;
import com.deepansh.LoanManagementSystem2.Entity.Cibil;
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

    @Autowired
    PasswordEncoder passwordEnoder;

    public List<LoanResponseDTo> getAllLoans(String username){
       
       User user= userRepository.findByUsername(username);
       String pan=documentRepo.findDocumentNumberByUserIdAndType(user.getId(),"pan");
       int score=cibilRepo.findScoreByPan(pan);;
       List<Loan> loans = loanService.getAllLoans(user.getId());
       List<LoanResponseDTo> loanResponseDToList = loans.stream().map(loan -> 
           new LoanResponseDTo(loan.getId(),  loan.getLoanType().getLabel(), loan.getStatus(), loan.getAppliedAmt(), score, loan.getApplicantName(), loan.getLoanType().getLabel(), loan.getIncome())
       ).toList();
       for (LoanResponseDTo loan : loanResponseDToList) {
        loan.setScore(score);
       }
       return loanResponseDToList;
      
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
    
  public void updateLoanStatus(Long loanId, String status){
    Optional<Loan> loan=loanRepo.findById(loanId);
    loan.map(l->{
        l.setStatus(status);
        return loanRepo.save(l);
    }).orElseThrow(()->new RuntimeException("Loan not found"));

  }

  public User registerUser(SignUpDTO user){
    System.out.println("user: "+user);
    User newUser=User.builder()
                    .name(user.getName())
                    .username(user.getUsername())
                    .password(passwordEnoder.encode(user.getPassword()))
                    .dob(user.getDob())
                    .role("ROLE_USER")
                    .build();
     userRepository.save(newUser);

     Document pan=Document.builder()
                        .documentType("pan")
                        .documentNumber(user.getPan())
                        .user(newUser)
                        .build();
    Document aadhaar=Document.builder()
                        .documentType("aadhaar")
                        .documentNumber(user.getAadhaar())
                        .user(newUser)
                        .build();
    documentRepo.saveAll(List.of(pan,aadhaar)); 
    Cibil cibil=Cibil.builder()
                .pan(user.getPan())
                .user(newUser)
                .score(user.getCibilScore())
                .build();
    cibilRepo.save(cibil);
    return newUser;

  }

    public boolean checkUsernameExists(String username){
        return    userRepository.findByUsername(username) != null;
    }
 
    
}
