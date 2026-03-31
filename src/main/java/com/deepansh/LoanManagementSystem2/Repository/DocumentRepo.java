package com.deepansh.LoanManagementSystem2.Repository;

import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.Document;
import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.User;

@Repository

public interface DocumentRepo extends JpaRepository<Document, Long> {
    

    public List<Loan> findBydocumentNumber(String documentNumber);
    public User findUserByDocumentNumber(String documentNumber);
    @Query("SELECT d.documentNumber FROM Document d WHERE d.user.id = :userId AND d.documentType = :type")
    String findDocumentNumberByUserIdAndType(Long userId, String type);
    public String findByDocumentType(String documentType, Long userId);
    
    public List<Document> findAllByUserId(Long userId);
}
