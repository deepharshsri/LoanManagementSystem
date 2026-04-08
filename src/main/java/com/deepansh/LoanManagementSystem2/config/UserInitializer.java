package com.deepansh.LoanManagementSystem2.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.deepansh.LoanManagementSystem2.Entity.Cibil;
import com.deepansh.LoanManagementSystem2.Entity.Document;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.CibilRepo;
import com.deepansh.LoanManagementSystem2.Repository.DocumentRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

@Component
@Order(0)
public class UserInitializer implements CommandLineRunner{

    @Autowired
    UserRepository userRepository;

     @Autowired
     DocumentRepo documentRepo;

     @Autowired
     CibilRepo cibilRepo;
    @Autowired
    PasswordEncoder passwordEncoder;
   


    @Override
    public void run(String... args) throws Exception {
       User user=new User().builder().name("Deepansh").username("Deepansh@gmail.com")
                        .password(passwordEncoder.encode("Deepansh")).dob("19/04/1998")
                        .role("ROLE_USER").build();
    User user2=new User().builder().name("Pratap").username("Pratap@gmail.com")
                        .password(passwordEncoder.encode("Pratap")).dob("01/04/1980")
                        .role("ROLE_MAKER").build();   
    User user3=new User().builder().name("Jitendra").username("Jitendra@gmail.com")
                        .password(passwordEncoder.encode("Jitendra")).dob("01/04/1970")
                        .role("ROLE_CHECKER").build();  
    User user4=new User().builder().name("Deepak").username("Deepak@gmail.com")
                        .password(passwordEncoder.encode("Deepak")).dob("01/04/1988")
                        .role("ROLE_AUTHORIZER").build();                                      
    Document aadhar=new Document().builder().documentNumber("1234 5678 9012")
                                  .documentType("aadhaar").user(user).build();
    Document pan=new Document().builder().documentNumber("ABCDE1234F")
                                  .documentType("pan").user(user).build();                            
    userRepository.saveAll(List.of(user,user2,user3,user4)); 
    documentRepo.saveAll(List.of(aadhar,pan));
    user.setDocuments(List.of(aadhar,pan));
    Cibil cibil=new Cibil().builder().score(400).pan("ABCDE1234F").user(user).build();
    cibilRepo.save(cibil);
    user.setCibil(cibil); 
    userRepository.save(user);    
    }
}
