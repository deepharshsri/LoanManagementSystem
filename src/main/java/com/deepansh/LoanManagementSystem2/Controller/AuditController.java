package com.deepansh.LoanManagementSystem2.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Repository.LoanRepo;
import com.deepansh.LoanManagementSystem2.Service.AuditService;
import com.deepansh.LoanManagementSystem2.Service.AuditService;

@RestController
@RequestMapping("/api/audit/save")
public class AuditController {
    
    @Autowired
    AuditService auditService;


    @PostMapping
    public void saveAudit(Authentication authentication,@RequestBody Map<String,String> request){

       String name=authentication.getName();
       auditService.saveAudit(request,name);
    }
    

}
