package com.deepansh.LoanManagementSystem2.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.deepansh.LoanManagementSystem2.Entity.Loan;
import com.deepansh.LoanManagementSystem2.Entity.LoanType;
import com.deepansh.LoanManagementSystem2.Repository.LoanTypeRepo;


@Component
@Order(1)
public class LoanTypeInitializer implements CommandLineRunner{

    @Autowired
    LoanTypeRepo loanTypeRepo;
    
    @Override
    public void run(String... args) throws Exception {
         LoanType loanType1=new LoanType().builder().id("salary").label("Salary Loan")
                                   .description("Based on net monthly salary") .rate(10.0) .minAmount(500000)
                                   .build();
    LoanType loanType2=new LoanType().builder().id("itr").label("ITR Loan")
                                   .description("Self-employed/buiness").rate(11.0)
                                   .minAmount(500000).build();
    LoanType loanType3=new LoanType().builder().id("pension").label("Pension Loan")
                                   .description("For retired pensioners")
                                   .rate(9.5).minAmount(500000)
                                   .build();  
    LoanType loanType4=new LoanType().builder().id("agri").label("Agriculture Loan")
                                   .description("Against agricultural land")
                                   .rate(7.0).minAmount(500000).build();            
    LoanType loanType5=new LoanType().builder().id("housing").label("Housing Loan")
                                   .description("Flats and property purchase").rate(8.5)
                                   .minAmount(500000).build();  
    LoanType loanType6=new LoanType().builder()
                                   .id("car").label("Car Loan")
                                   .description("Upto 90% of vehicle price").rate(9.0)
                                   .minAmount(500000).build();   
    LoanType loanType7=new LoanType().builder().id("bike").label("Bike Loan")
                                   .description("Two wheeler purchase")
                                   .rate(12.0).minAmount(500000) .build(); 
    LoanType loanType8=new LoanType().builder().id("gold").label("Gold Loan")
                                   .description("Against gold ornaments").rate(8.0)
                                   .minAmount(500000).build();
    List<LoanType> list=List.of(loanType1,loanType2,loanType3,loanType4,loanType5,loanType6,loanType7,loanType8);                                  
    loanTypeRepo.saveAll(list);       
    }
    

    
}
