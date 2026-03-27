package com.deepansh.LoanManagementSystem2.config;

import java.io.IOException;
import java.security.Key;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.deepansh.LoanManagementSystem2.Auth.AuthDetailService;
import com.deepansh.LoanManagementSystem2.Entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JWTFilter extends OncePerRequestFilter{

    @Value("${jwt.secret}")
    String key;

    @Autowired
    AuthDetailService authDetailService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token=extractTokenFromHeader(request);
        if(token!=null){
                    //validate the token
                   UserDetails userDetails=  validateToken(token);
                         UsernamePasswordAuthenticationToken authentication=new UsernamePasswordAuthenticationToken(
                                                                 userDetails,
                                                                 null,
                                                                 userDetails.getAuthorities()
         );
         SecurityContextHolder.getContext().setAuthentication(authentication);
         
                }
        filterChain.doFilter(request, response);
        }
     
            private String extractTokenFromHeader(HttpServletRequest request){
        String bearerToken=request.getHeader("Authorization");
        
        if(bearerToken!=null&&bearerToken.startsWith("Bearer ")){
            return bearerToken.substring(7);
        }
        return null;
    }

    private UserDetails validateToken(String substring) {
            String bearerToken=extractToken(substring);
            return authDetailService.loadUserByUsername(bearerToken);
    }

     public Key getSignKey(){
       byte[] keyChar = key.getBytes();
       return Keys.hmacShaKeyFor(keyChar); 
       
    }
     public String extractToken(String token) {
        Claims claims =Jwts.parserBuilder()
                       .setSigningKey(getSignKey())
                       .build()
                       .parseClaimsJws(token)
                       .getBody();
       return claims.getSubject();
    }
}
