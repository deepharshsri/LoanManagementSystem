package com.deepansh.LoanManagementSystem2.Auth;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.deepansh.LoanManagementSystem2.Entity.User;


public class AuthDetails implements UserDetails{
    
    
    User user;


   public AuthDetails(User user){
      this.user=user;
                 
   }


@Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    // TODO Auto-generated method stub
   return List.of(new SimpleGrantedAuthority(user.getRole()));
}

@Override
public String  getPassword() {
  
    return user.getPassword();
}

@Override
public String getUsername() {
    return user.getUsername();
}

@Override
public boolean isAccountNonExpired() {
    return true;
}

@Override
public boolean isAccountNonLocked() {
    return true;
}

@Override
public boolean isCredentialsNonExpired() {
    return true;
}

@Override
public boolean isEnabled() {
    return true;
}



}