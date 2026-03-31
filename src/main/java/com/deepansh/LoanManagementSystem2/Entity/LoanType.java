package com.deepansh.LoanManagementSystem2.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;


@Builder
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor

public class LoanType {
    
    @Id
    private String id;
    private String lable;
    private String description;
    private Double rate;
    private Integer mult;
    private Integer minAmount;
    private Integer maxAmount; 
    
    @JsonIgnore
    @OneToMany(mappedBy = "loanType")
    private List<Loan> loans;
}
