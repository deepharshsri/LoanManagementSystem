package com.deepansh.LoanManagementSystem2.Controller;

import com.deepansh.LoanManagementSystem2.Service.LoanService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.DTO.LoanApplicationDto;
import com.deepansh.LoanManagementSystem2.DTO.LoanResponseDTo;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;
import com.deepansh.LoanManagementSystem2.Service.UserService;

@RestController
@RequestMapping("/api")
public class userController {
  

  @Autowired
  private LoanService loanService;
  
  @Autowired
  private UserService userService;

  @Autowired
  private LoanRepo loanRepo;


  @GetMapping("/loans/all")
public ResponseEntity<?> getAllLoans(Authentication authentication) {
    return ResponseEntity.ok(loanRepo.findAll());
}
  
  @GetMapping("/loans/my")
  public ResponseEntity<List<LoanResponseDTo>> getMyLoans(Authentication authentication){
    String username=authentication.getName();
    System.out.println("username: "+username);
    System.err.println(username);
    // return ResponseEntity.ok(new ArrayList<>());
    return ResponseEntity.ok(userService.getAllLoans(username));
  }

  @GetMapping("/user/profile")
  public ResponseEntity<?> getUserProfile(Authentication authentication){
    String username=authentication.getName();
    User user = userService.findByUserName(username);
    return ResponseEntity.ok(Map.of(
        "name", user.getUsername(),
        "dob",  user.getDob()
    ));
  }

  @PostMapping("/loans/apply")
  public ResponseEntity<?> applyForLoan(Authentication authentication,@RequestBody LoanApplicationDto loanRequest){
    String username=authentication.getName();
    User user = userService.findByUserName(username);
    System.out.println("loan request: "+loanRequest.getApplicantName());
    loanService.requestLoan(user.getId(), loanRequest);
    return ResponseEntity.ok(Map.of(
        "message", "Loan application submitted successfully"
    ));
  }
  
  @PutMapping("loans/{id}/status")
  public ResponseEntity<?> updateLoanStatus(Authentication authentication, @PathVariable Long id, @RequestBody Map<String,String> request){
    String username=authentication.getName();
    User user = userService.findByUserName(username);
    if(user==null){
        return ResponseEntity.status(404).body(Map.of(
            "error", "User not found"
        ));
    }
    String status=request.get("status");
  
    loanService.updateLoanStatus(id, status,request.get("rejectReason"));
   
    return ResponseEntity.ok(Map.of(
        "message", "Loan status updated successfully"
    ));
  }

}
