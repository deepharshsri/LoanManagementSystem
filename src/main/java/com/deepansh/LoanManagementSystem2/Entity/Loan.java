package com.deepansh.LoanManagementSystem2.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Loan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String applicantName;
    private String mobile;
    private String pan;
    private String dob;
    private Double income; 
    private String employer;
    private String empType;
    private String tenure;
    private Double eligibleAmount;
    private Double emi;
  
    
    @ManyToOne
    @JoinColumn (name = "user_id")
    @JsonIgnore
    private User user;
    
    private String loanName;
    Integer score;

    @ManyToOne
    @JoinColumn (name = "loan_type_id")
    private LoanType loanType; 
    
    @ManyToMany
    @JoinTable(
        name = "loan_documents",
        joinColumns = @JoinColumn(name = "loan_id"),
        inverseJoinColumns = @JoinColumn(name = "document_id")
    )   
    private List<Document> documents;

    @OneToMany(mappedBy = "loan")
    private List<ApprovalWorkflow> approvalWorkflows;

    @OneToMany(mappedBy = "loan")
    private List<DisbursementStage> disbursementStages;


}
