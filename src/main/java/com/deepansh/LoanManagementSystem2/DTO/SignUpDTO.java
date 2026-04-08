package com.deepansh.LoanManagementSystem2.DTO;

import jakarta.persistence.criteria.CriteriaBuilder.In;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignUpDTO {
    
    String name;
    String username;
    String password;
    String dob;
    String aadhaar;
    String pan;
    Integer cibilScore;

}
