package com.deepansh.LoanManagementSystem2.Service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Entity.Audit;
import com.deepansh.LoanManagementSystem2.Entity.AuditFlag;
import com.deepansh.LoanManagementSystem2.Repository.AuditRepo;

@Service
public class AuditService {
   
    @Autowired
    AuditRepo auditRepo;
    public void saveAudit(Map<String,String> request,String name){

       
        Audit audit=new Audit().builder()
                    .loanType(request.get("loanType"))
                    .status(request.get("status"))
                    .createdBy(request.get("createdBy"))
                    .createdAt(request.get("createdAt"))
                    .checkedBy(request.get("checkedBy"))
                    .checkedAt(request.get("checkedAt"))
                    .approvedBy(request.get("approvedBy"))
                    .approvedAt(request.get("approvedAt"))
                    .disbursedBy(request.get("disbursedBy"))
                    .disbursedAt(request.get("disbursedAt"))
                    .cibil(request.get("cibil"))
                    .eligibleAmt(Integer.valueOf(request.get("eligibleAmt")))
                    .sanctionedAmt(Integer.valueOf(request.get("sanctionedAmt")))
                    .reason(request.get("reason"))
                    .rejectedBy(request.get("rejectedBy"))
                    .remarks(request.get("remarks"))
                    .auditorName(name)
                    .auditedAt(java.time.LocalDateTime.now())
                    .build();

           if(request.get("flag").equals("COMPLAINT")) audit.setFlag(AuditFlag.COMPLAINT);
           else if(request.get("flag").equals("WARNING")) audit.setFlag(AuditFlag.WARNING);
           else if(request.get("flag").equals("NON_COMPLIANT")) audit.setFlag(AuditFlag.NON_COMPLIANT);
           
           auditRepo.save(audit);
    }
}
