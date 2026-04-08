package com.deepansh.LoanManagementSystem2.Controller;

import com.deepansh.LoanManagementSystem2.Repository.DocumentRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Auth.AuthDetailService;
import com.deepansh.LoanManagementSystem2.Auth.AuthResponse;
import com.deepansh.LoanManagementSystem2.Auth.Login;
import com.deepansh.LoanManagementSystem2.DTO.SignUpDTO;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Service.AuthService;
import com.deepansh.LoanManagementSystem2.Service.UserService;

@RestController
@RequestMapping("/api/auth")
public class authController {
    
    @Autowired
    private UserRepository userRepository;
    @Autowired 
     private DocumentRepo documentRepo;

     @Autowired
     AuthService authService;

     @Autowired
     UserService userService;

   
     @PostMapping("/login")
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
     
     @PostMapping("/register")
     public ResponseEntity<?> register(@RequestBody SignUpDTO user){

      return ResponseEntity.ok(userService.registerUser(user));
     }
     
     @GetMapping("/check-duplicate")
     public ResponseEntity<?> checkUsername(@RequestParam String field,@RequestParam String value){
          boolean exist=switch (field) {
               case "email"-> userRepository.findByUsername(value)!=null;
               case "pan"->documentRepo.existsByDocumentNumber(value);
               case "aadhaar"-> documentRepo.existsByDocumentNumber(value);    
               default->false;
          };
          return ResponseEntity.ok(Map.of("exists", exist));
     }
   
}
