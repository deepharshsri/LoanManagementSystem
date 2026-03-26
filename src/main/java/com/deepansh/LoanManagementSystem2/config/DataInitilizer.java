package com.deepansh.LoanManagementSystem2.config;


import java.net.PasswordAuthentication;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

@Component
public class DataInitilizer implements CommandLineRunner{
    
@Autowired
UserRepository userRepository;

@Autowired
PasswordEncoder passwordEncoder;

@Override
public void run(String... args) throws Exception {
    // TODO Auto-generated method stub
    User user=new User().builder()
                        .username("Deepansh@gmail.com")
                        .password(passwordEncoder.encode("Deepansh"))
                        .role("ROLE_ADMIN")
                        .build();
   userRepository.save(user);
}

}
