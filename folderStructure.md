loan-management-system/
 ├── src/main/java/com/bank/loan/
 │    ├── config/
 │    │    ├── SecurityConfig.java
 │    │    ├── RedisConfig.java
 │    │    └── SwaggerConfig.java
 │    │
 │    ├── controller/
 │    │    ├── LoanController.java
 │    │    ├── UserController.java
 │    │    ├── KycController.java
 │    │    └── DisbursementController.java
 │    │
 │    ├── entity/
 │    │    ├── User.java
 │    │    ├── Role.java
 │    │    ├── Loan.java
 │    │    ├── LoanType.java
 │    │    ├── KycDocument.java
 │    │    ├── ApprovalWorkflow.java
 │    │    └── DisbursementStage.java
 │    │
 │    ├── repository/
 │    │    ├── UserRepository.java
 │    │    ├── LoanRepository.java
 │    │    ├── KycRepository.java
 │    │    └── WorkflowRepository.java
 │    │
 │    ├── service/
 │    │    ├── LoanService.java
 │    │    ├── EligibilityService.java
 │    │    ├── KycService.java
 │    │    ├── FraudDetectionService.java
 │    │    ├── CibilSimulatorService.java
 │    │    ├── WorkflowService.java
 │    │    └── DisbursementService.java
 │    │
 │    ├── dto/
 │    │    ├── LoanRequestDto.java
 │    │    ├── LoanResponseDto.java
 │    │    ├── KycDto.java
 │    │    └── EmiCalculationDto.java
 │    │
 │    ├── util/
 │    │    ├── EmiCalculator.java
 │    │    ├── RedisMonitor.java
 │    │    └── FraudPatternAnalyzer.java
 │    │
 │    └── LoanManagementSystemApplication.java
 │
 └── src/main/resources/
      ├── application.yml
      └── schema.sql
