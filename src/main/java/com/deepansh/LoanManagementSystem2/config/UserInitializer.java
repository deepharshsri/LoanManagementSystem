package com.deepansh.LoanManagementSystem2.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


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

    User user2=new User().builder().name("Pratap").username("Pratap@gmail.com")
                        .password(passwordEncoder.encode("Pratap")).dob("01/04/1980")
                        .role("ROLE_MAKER").build();   
    User user3=new User().builder().name("Jitendra").username("Jitendra@gmail.com")
                        .password(passwordEncoder.encode("Jitendra")).dob("01/04/1970")
                        .role("ROLE_CHECKER").build();  
    User user4=new User().builder().name("Deepak").username("Deepak@gmail.com")
                        .password(passwordEncoder.encode("Deepak")).dob("01/04/1988")
                        .role("ROLE_AUTHORIZER").build();     
    User user5=new User().builder().name("Admin").username("Admin@gmail.com")
                        .password(passwordEncoder.encode("Admin")).dob("01/04/1988")
                        .role("ROLE_AUDITOR").build();
    userRepository.saveAll(List.of(user2,user3,user4,user5)); 
 
    }
}
