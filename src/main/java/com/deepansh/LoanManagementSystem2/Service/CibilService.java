package com.deepansh.LoanManagementSystem2.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.deepansh.LoanManagementSystem2.Repository.CibilRepo;

@Service
public class CibilService {
    
    @Autowired
    private CibilRepo cibilRepo;
    
    public Integer getCibilScore(String pan ){
        return cibilRepo.findScoreByPan(pan);
    }

  
}
