package com.deepansh.LoanManagementSystem2.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LoanApplicationDto {

    String loanTypeId;
    String applicantName;
    String mobile;
    String pan;
    String dob;
    Double income;
    String employer;
    String empType;
    String tenure;
    Double eligibleAmount;
    Double emi;
    Integer appliedAmt;

    
}
