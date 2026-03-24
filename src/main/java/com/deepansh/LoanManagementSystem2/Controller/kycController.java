package com.deepansh.LoanManagementSystem2.Controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepansh.LoanManagementSystem2.Entity.Document;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Service.DocumentService;

@RestController
@RequestMapping("/api/kyc")
public class kycController {
    
    @Autowired
    private DocumentService documentService;

    @GetMapping("/loans/{documentNumber}")
    public ResponseEntity<List<Loan>> getAllLoans(@PathVariable String documentNumber){
        return ResponseEntity.ok(documentService.getAllLoans(documentNumber));
    }

    @GetMapping("/user/{documentNumber}")
    public ResponseEntity<User> getAllLoansByUserId(@PathVariable String documentNumber){
        return ResponseEntity.ok(documentService.findUser(documentNumber));
    }
    
    @PostMapping
    public void addDocument(@PathVariable Document document,Long userId){
        documentService.addDocument(document,userId);
    }
}
