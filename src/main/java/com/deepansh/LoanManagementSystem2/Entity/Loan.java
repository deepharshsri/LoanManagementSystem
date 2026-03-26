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

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Loan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private int loanAmount;
    private String loanStatus;

    @ManyToOne
    @JoinColumn (name = "user_id")
    private User user;

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
