package com.deepansh.LoanManagementSystem2.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Auth.AuthDetailService;
import com.deepansh.LoanManagementSystem2.Auth.AuthResponse;
import com.deepansh.LoanManagementSystem2.Auth.Login;
import com.deepansh.LoanManagementSystem2.Service.AuthService;

@RestController
@RequestMapping("/api/auth/login")
public class authController {
    
     @Autowired
     AuthService authService;

     @PostMapping
     public AuthResponse login(@RequestBody Login login){
        
        //authenticate the user
        System.out.println("loginName: "+login.getUsername()+" loginPass: "+login.getPassword());
        UserDetails userDetails=authService.authenticateUser(login.getUsername(),login.getPassword() );
        String token=authService.generateToken(userDetails);
        return  AuthResponse.builder()
                            .token(token)
                            .expiryTime("86400")
                            .role(userDetails.getAuthorities().iterator().next().getAuthority())
                            .build();
                            
                              

     }

}
