package com.deepansh.LoanManagementSystem2.config;


import java.net.PasswordAuthentication;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.deepansh.LoanManagementSystem2.Entity.Cibil;
import com.deepansh.LoanManagementSystem2.Entity.Document;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.CibilRepo;
import com.deepansh.LoanManagementSystem2.Repository.DocumentRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;
import com.deepansh.LoanManagementSystem2.Repository.LoanTypeRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

@Component
@Order(2)
public class LoanInitializer implements CommandLineRunner{
    
@Autowired
UserRepository userRepository;
@Autowired
LoanRepo loanRepo;
@Autowired
LoanTypeRepo loanTypeRepo;
@Autowired
PasswordEncoder passwordEncoder;
@Autowired
DocumentRepo documentRepo;
@Autowired
CibilRepo cibilRepo;

@Override


public void run(String... args) throws Exception {
    // TODO Auto-generated method stub
  
   User user= userRepository.findByUsername("Deepansh@gmail.com");
   LoanType loanType1=loanTypeRepo.findById("salary").orElseThrow(()->new RuntimeException("Loan type not found"));


   Loan loan=new Loan().builder()
                        .loanType(loanType1)
                        .applicantName("Deepansh")
                        .mobile("9876543210")
                        .pan("ABCDE1234F")
                        .dob("19/04/1998")
                        .income(100000.00)
                        .employer("ABC Pvt Ltd")
                        .empType("Salaried")
                        .tenure("5 years")
                        .eligibleAmount(2000000.00)
                        .emi(41666.2)
                        .score(user.getCibil().getScore())
                        .user(user)
                        .status("pending")
                        .appliedAmt(500000)
                        .build();
    
     loanRepo.save(loan);                   
}                  
                        

}
