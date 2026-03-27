package com.deepansh.LoanManagementSystem2.config;


import java.net.PasswordAuthentication;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.authentication.AuthenticationManagerFactoryBean;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    
    @Autowired  
    JWTFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
     http.cors(cors->cors.configurationSource(corsConfig()))
          .authorizeHttpRequests(authr->authr
          .requestMatchers(HttpMethod.POST,"/api/auth/login").permitAll()
          .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
          .anyRequest().permitAll())
          .csrf(csrf->csrf.disable())
          .sessionManagement(sesssion->sesssion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .formLogin(form->form.disable())
          .httpBasic(basic->basic.disable())
          .addFilterAfter(jwtFilter, UsernamePasswordAuthenticationFilter.class);
          return http.build();
          
         
    }

    @Bean
    public CorsConfigurationSource corsConfig() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173")); // ← React URL
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE","PATCH"));
    config.setAllowedHeaders(List.of("*"));
    return request -> config;
    }
    
    @Bean
    public AuthenticationManager authenticateManager(AuthenticationConfiguration cofig) throws Exception{
        return cofig.getAuthenticationManager();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}
