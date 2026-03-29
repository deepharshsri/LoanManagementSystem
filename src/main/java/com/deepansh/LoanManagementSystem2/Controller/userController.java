package com.deepansh.LoanManagementSystem2.Controller;

import com.deepansh.LoanManagementSystem2.Service.LoanService;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Service.UserService;

@RestController
@RequestMapping("/api")
public class userController {
  

  @Autowired
  private LoanService loanService;
  
  @Autowired
  private UserService userService;

  
  @GetMapping("/loans/my")
  public ResponseEntity<List<Loan>> getAllLoans(Authentication authentication){
    String username=authentication.getName();
    System.out.println("username: "+username);
    System.err.println(username);
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
  public ResponseEntity<?> applyForLoan(Authentication authentication, Loan loanRequest){
    String username=authentication.getName();
    User user = userService.findByUserName(username);
    // Process the loan application using the user and request data
    // For example, you can call a service method to handle the application logic
    // loanService.applyForLoan(user, request);
    loanService.requestLoan(user.getId(), loanRequest);
    return ResponseEntity.ok(Map.of(
        "message", "Loan application submitted successfully"
    ));
  }

}
