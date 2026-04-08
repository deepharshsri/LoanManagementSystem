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
    
    @Query("SELECT l FROM Loan l JOIN l.user u JOIN u.documents d WHERE d.documentNumber = :documentNumber")

    public List<Loan> findLoansBydocumentNumber(String documentNumber);
   
    
    @Query("SELECT u FROM User u JOIN u.documents d WHERE d.documentNumber = :documentNumber")
    public User findUserByDocumentNumber(String documentNumber);
    @Query("SELECT d.documentNumber FROM Document d WHERE d.user.id = :userId AND d.documentType = :type")
    String findDocumentNumberByUserIdAndType(Long userId, String type);
    
    @Query("SELECT d FROM Document d WHERE d.documentType = :documentType AND d.user.id = :userId")
    public Document findValueByDocumentType(String documentType, Long userId);
    
    public List<Document> findAllByUserId(Long userId);

    public boolean existsByDocumentNumber(String documentNumber);
}
