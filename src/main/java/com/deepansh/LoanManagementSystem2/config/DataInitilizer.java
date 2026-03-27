package com.deepansh.LoanManagementSystem2.config;


import java.net.PasswordAuthentication;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanTypeRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

@Component
public class DataInitilizer implements CommandLineRunner{
    
@Autowired
UserRepository userRepository;
@Autowired
LoanRepo loanRepo;
@Autowired
LoanTypeRepo loanTypeRepo;
@Autowired
PasswordEncoder passwordEncoder;

@Override
public void run(String... args) throws Exception {
    // TODO Auto-generated method stub
    User user=new User().builder()
                        .username("Deepansh@gmail.com")
                        .password(passwordEncoder.encode("Deepansh"))
                        .role("ROLE_USER")
                        .build();
   userRepository.save(user);
   LoanType loanType=new LoanType().builder()
                                   .id("Salary")
                                   .lable("Salaried Person")
                                   .description("for salaried person")
                                   .rate(10.0)
                                   .minAmount(500000)
                                   .build();
   loanTypeRepo.save(loanType);
   Loan loan=new Loan().builder()
                        .loanName(loanType.getId())
                        .status("Applied")
                        .amount(500000L)
                        .user(user)
                        .build();
    
     loanRepo.save(loan);                   
}                  
                        

}
