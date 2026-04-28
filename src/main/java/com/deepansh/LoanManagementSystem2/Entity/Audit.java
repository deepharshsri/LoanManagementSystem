package com.deepansh.LoanManagementSystem2.Entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Audit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String loanType;
    private String status;
    //created by
    private String createdBy;
    private String createdAt;
    private String checkedBy;
    private String checkedAt;
    private String approvedBy;
    private String approvedAt;
    private String disbursedBy;
    private String disbursedAt;
    private String cibil;
    private Integer eligibleAmt;
    private Integer sanctionedAmt;
    private String reason;
    private String rejectedBy;
    private String remarks;
    private AuditFlag flag;
    private String auditorName;
    private LocalDateTime auditedAt;

    
    


}
