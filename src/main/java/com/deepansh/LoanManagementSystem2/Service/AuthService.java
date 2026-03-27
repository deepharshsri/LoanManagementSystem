package com.deepansh.LoanManagementSystem2.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import com.deepansh.LoanManagementSystem2.Auth.AuthDetailService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class AuthService {

    @Value("${jwt.secret}")
    String key;

    @Autowired
    AuthDetailService authDetailService;

    @Autowired
    AuthenticationManager authenticationManager;
    
    public UserDetails  authenticateUser(String username,String password){
      
      authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));

      return authDetailService.loadUserByUsername(username);
    }

    public String generateToken(UserDetails userDetails){
        
        Map<String,Object> claims=new HashMap<>();
        claims.put("role",userDetails.getAuthorities().iterator().next().getAuthority());
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis()+86400000))
            .signWith(getSignKey(),SignatureAlgorithm.HS256)
            .compact();
    }

    public Key getSignKey(){
       byte[] keyChar = key.getBytes();
       return Keys.hmacShaKeyFor(keyChar); 
       
    }
}
