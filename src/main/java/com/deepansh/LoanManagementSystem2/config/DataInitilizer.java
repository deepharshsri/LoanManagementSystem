package com.deepansh.LoanManagementSystem2.config;


import java.net.PasswordAuthentication;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.deepansh.LoanManagementSystem2.Entity.Document;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.DocumentRepo;
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
@Autowired
DocumentRepo documentRepo;

@Override
public void run(String... args) throws Exception {
    // TODO Auto-generated method stub
    User user=new User().builder().username("Deepansh@gmail.com")
                        .password(passwordEncoder.encode("Deepansh")).dob("19/04/1998")
                        .role("ROLE_USER").build();
    Document aadhar=new Document().builder().documentNumber("1234 5678 9012")
                                  .documentType("aadhaar").user(user).build();
    Document pan=new Document().builder().documentNumber("ABCDE1234F")
                                  .documentType("pan").user(user).build();                            
    
    userRepository.save(user);                              documentRepo.saveAll(List.of(aadhar,pan));
    user.setDocuments(List.of(aadhar,pan));
    userRepository.save(user);
   LoanType loanType1=new LoanType().builder().id("salary").lable("Salary Loan")
                                   .description("Based on net monthly salary") .rate(10.0) .minAmount(500000)
                                   .build();
    LoanType loanType2=new LoanType().builder().id("itr").lable("ITR Loan")
                                   .description("Self-employed/buiness").rate(11.0)
                                   .minAmount(500000).build();
    LoanType loanType3=new LoanType().builder().id("pension").lable("Pension Loan")
                                   .description("For retired pensioners")
                                   .rate(9.5).minAmount(500000)
                                   .build();  
    LoanType loanType4=new LoanType().builder().id("agri").lable("Agriculture Loan")
                                   .description("Against agricultural land")
                                   .rate(7.0).minAmount(500000).build();            
    LoanType loanType5=new LoanType().builder().id("housing").lable("Housing Loan")
                                   .description("Flats and property purchase").rate(8.5)
                                   .minAmount(500000).build();  
    LoanType loanType6=new LoanType().builder()
                                   .id("car").lable("Car Loan")
                                   .description("Upto 90% of vehicle price").rate(9.0)
                                   .minAmount(500000).build();   
    LoanType loanType7=new LoanType().builder().id("bike").lable("Bike Loan")
                                   .description("Two wheeler purchase")
                                   .rate(12.0).minAmount(500000) .build(); 
    LoanType loanType8=new LoanType().builder().id("gold").lable("Gold Loan")
                                   .description("Against gold ornaments").rate(8.0)
                                   .minAmount(500000).build();
    List<LoanType> list=List.of(loanType1,loanType2,loanType3,loanType4,loanType5,loanType6,loanType7,loanType8);                                  
    loanTypeRepo.saveAll(list);       

   Loan loan=new Loan().builder()
                        .loanName(loanType1.getId())
                         .income(500000)
                        .user(user)
                        .build();
    
     loanRepo.save(loan);                   
}                  
                        

}
