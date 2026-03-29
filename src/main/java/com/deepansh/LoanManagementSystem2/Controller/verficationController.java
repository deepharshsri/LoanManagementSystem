package com.deepansh.LoanManagementSystem2.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.service.annotation.GetExchange;

import com.deepansh.LoanManagementSystem2.Service.UserService;

@RestController
@RequestMapping("/api")
public class verficationController {


    @Autowired
    UserService userService;

    private String optStored;

  @PostMapping("/kyc/verify")
  public ResponseEntity<?> verifyKYC(Authentication authentication,@RequestBody Map<String,String> request){
    System.out.println("request: "+request);
    String username=authentication.getName();
    boolean isVerified = userService.verifyKYC(username,request);
    System.out.println("isVerified: "+isVerified);
    return ResponseEntity.ok(Map.of(
        "verified", isVerified,
        "name", userService.findByUserName(username).getUsername(),
        "message", isVerified ? "KYC verified successful" : "KYC verification failed"
    ));
  }

  @PostMapping("/otp/send")
  public ResponseEntity<?> generateOtp(Authentication authentication,@RequestBody Map<String,String> request){
    System.out.println("request: "+request);
    String username=authentication.getName();
    if(username==null || username.isEmpty()){
    return ResponseEntity.badRequest().body(Map.of(
        "message", "Invalid username"
    ));
    }
    String otp = String.valueOf((int)(Math.random() * 900000) + 100000);
    this.optStored=otp;
    System.out.println("isValid: "+optStored);
    return ResponseEntity.ok(Map.of(
        "otp", otp,
        "message", "OTP generated successfully"
    ));
   
}

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(Authentication authentication, @RequestBody Map<String, String> request){
        String username=authentication.getName();
        System.out.println("request: "+request);
        String otp = request.get("otp");
        if(username==null || username.isEmpty() || otp==null || otp.isEmpty()){
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Invalid username or OTP"
            ));
        }
        boolean isValid = otp.equals(this.optStored);
        
        return ResponseEntity.ok(Map.of(
            "message",isValid ? "OTP verified successfully":"OTP verification failed"
        ));
    }
}
