package com.deepansh.LoanManagementSystem2.Entity;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Document {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

private String documentType;
private String documentNumber;

@ManyToOne
@JoinColumn(name = "user_id")
private User user;

// @ManyToMany(mappedBy="documents" )
// private List<Loan> loan;

}
