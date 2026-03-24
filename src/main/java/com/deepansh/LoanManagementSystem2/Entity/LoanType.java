package com.deepansh.LoanManagementSystem2.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoanType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String loanName;
    private String description;
    private Double interestRate;
    private Integer tenure;
    private Double minAmount;
    private Double maxAmount; 

    @OneToMany(mappedBy = "loanType")
    private List<Loan> loans;
}
