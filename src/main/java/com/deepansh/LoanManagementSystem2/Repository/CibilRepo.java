package com.deepansh.LoanManagementSystem2.Repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepansh.LoanManagementSystem2.Entity.Cibil;
import com.deepansh.LoanManagementSystem2.Entity.User;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface CibilRepo extends JpaRepository<Cibil,Long>{
    

    @Query("SELECT c.score FROM Cibil c WHERE c.pan = :pan")
    public Integer findScoreByPan(String pan);

    public Cibil findByUserId(Long userId);
}
