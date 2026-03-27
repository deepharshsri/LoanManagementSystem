package com.deepansh.LoanManagementSystem2.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Service.UserService;

@RestController
@RequestMapping("/api/loans/my")
public class userController {
    
  @Autowired
  private UserService userService;

  @GetMapping
  public ResponseEntity<List<Loan>> getAllLoans(Authentication authentication){
    String username=authentication.getName();
    System.out.println("username: "+username);
    System.err.println(username);
    return ResponseEntity.ok(userService.getAllLoans(username));
  }

}
