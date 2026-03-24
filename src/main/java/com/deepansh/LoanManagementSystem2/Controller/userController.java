package com.deepansh.LoanManagementSystem2.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Service.UserService;

@RestController
@RequestMapping("/api/user")
public class userController {
    
  @Autowired
  private UserService userService;

  @GetMapping("/{userId}/loans")
  public ResponseEntity<List<Loan>> getAllLoans(@PathVariable Long userId ){
    return ResponseEntity.ok(userService.getAllLoans(userId));
  }

}
