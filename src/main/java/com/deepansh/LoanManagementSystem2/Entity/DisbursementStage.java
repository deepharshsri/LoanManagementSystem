package com.deepansh.LoanManagementSystem2.Entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.ManyToAny;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class DisbursementStage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stage;

    private LocalDateTime createDateAndTime;

    private Double amountReleased;
    
    private String remarks;

    @ManyToOne
    @JoinColumn(name = "loan_id")
    private Loan loan;
}
