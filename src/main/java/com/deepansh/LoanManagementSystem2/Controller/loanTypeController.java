package com.deepansh.LoanManagementSystem2.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Service.LoanTypeService;

@RestController
@RequestMapping("/api/loanType")
public class loanTypeController {
    
    @Autowired
    private LoanTypeService loanTypeService;
 
    @GetMapping
    public ResponseEntity<List<LoanType>> getLoanTypes(){
        return ResponseEntity.ok(loanTypeService.getLoanTypes());
    }
    


    @PostMapping
    public void addLoantype(@RequestBody LoanType loanType){
        loanTypeService.addLoantype(loanType);
    }

    @PatchMapping
        public ResponseEntity<LoanType> updateLoanTypePartially(@RequestBody LoanType loanType){
        return ResponseEntity.ok(loanTypeService.updateLoanTypePartially(loanType));
    }
} 
