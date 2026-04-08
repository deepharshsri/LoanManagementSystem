package com.deepansh.LoanManagementSystem2.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Entity.Document;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.User;
import com.deepansh.LoanManagementSystem2.Repository.DocumentRepo;
import com.deepansh.LoanManagementSystem2.Repository.UserRepository;

import java.util.stream.Collectors;

@Service
public class DocumentService {
    
    @Autowired
    private DocumentRepo documentRepo;
    
    @Autowired
    private UserRepository userRepository;

    public List<Loan> getAllLoans(String documentNumber){
        return documentRepo.findLoansBydocumentNumber(documentNumber);
    }
    
    public User findUser(String documentNumber){
        return documentRepo.findUserByDocumentNumber(documentNumber);
    }
    
    public void addDocument(Document document ,Long userId) {
        Optional<User> user = userRepository.findById(userId);
        document.setUser(user.get());   
        documentRepo.save(document);
    }


}
