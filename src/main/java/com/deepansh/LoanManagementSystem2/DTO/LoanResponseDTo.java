package com.deepansh.LoanManagementSystem2.DTO;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanResponseDTo {
    
    Long id;
    String loanName;
    String status;
    Integer appliedAmt;
    Integer score;
    String applicant;
    String type;
    Double income;
    String rejectReason;
}
