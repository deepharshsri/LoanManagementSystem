package com.deepansh.LoanManagementSystem2.Controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
// import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AiController {
 
    @Value("${groq.api.key}")
    private String apiKey;

    @PostMapping("/chat")
    public ResponseEntity<?>  chatWithAi(Authentication authentication, @RequestBody Map<String,Object> body){
    try {
    String prompt = body.get("prompt").toString();
    List<Map<String,Object>> history=(List<Map<String, Object>>) body.getOrDefault("history", new ArrayList<>());
    String systemPrompt="";
    if(authentication.getAuthorities().iterator().next().getAuthority().equals("ROLE_USER")){
           systemPrompt = "You are an AI Loan Advisor for an Indian bank.\\n"
            + "OUR LOAN PRODUCTS:\\n"
            + "1. Salary Loan - 10% rate, max = 60x monthly salary. For salaried employees.\\n"
            + "2. ITR Loan - 11% rate, max = 30x monthly income. For self-employed/business owners.\\n"
            + "3. Pension Loan - 9.5% rate, max = 40x monthly pension. For retired pensioners.\\n"
            + "4. Agriculture Loan - 7% rate, max = 10x income. Against agricultural land.\\n"
            + "5. Housing Loan - 8.5% rate, max = 80x monthly income. For flat/property purchase.\\n"
            + "6. Car Loan - 9% rate, upto 90% of vehicle price.\\n"
            + "7. Bike Loan - 12% rate, upto 85% of vehicle price.\\n"
            + "8. Gold Loan - 8% rate, upto 75% of gold value.\\n\\n"
            + "HOW TO RESPOND:\\n"
            + "- Ask ONE question at a time\\n"
            + "- Collect: 1) Employment type 2) Monthly income 3) CIBIL score 4) Existing loans\\n"
            + "- Recommend best matching loan with rate and max amount\\n"
            + "- If CIBIL below 650 warn them approval may be difficult\\n"
            + "- Only discuss loans and finance, nothing else\\n";
    }
   
    StringBuilder messages =new StringBuilder();
    messages.append("{\"role\":\"system\",\"content\":\""+systemPrompt+"\"}");

    for(Map<String,Object> msg:history){
     String role=msg.get("role").toString().equals("assistant")? "assistant":"user";
     String text=msg.get("text").toString()
     .replace("\"", "\\\"")  // ✅ add this
        .replace("\n", "\\n");
     messages.append(",{\"role\":\""+role+"\", \"content\":\""+text+"\"} ");
     }
     messages.append(",{\"role\":\"user\", \"content\":\""+prompt.replace("\"","\\\"").replace("\n","\\n")
     +"\"}");
  String groqBody = "{"
    + "\"model\":\"llama-3.1-8b-instant\","
    + "\"messages\":[" + messages.toString() + "],"
    + "\"max_tokens\":600"
    + "}";

    System.out.println("Sending to Groq..."); // ← debug

    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer " + apiKey)
        .POST(HttpRequest.BodyPublishers.ofString(groqBody))
        .build();

    HttpResponse<String> response = client.send(
        request, 
        HttpResponse.BodyHandlers.ofString()
    );

    System.out.println("Groq response: " + response.body()); // ← debug

    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(response.body());

    if(root.has("error")) {
        return ResponseEntity.status(500).body(
            Map.of("error", root.path("error").path("message").asText())
        );
    }

    String text = root
        .path("choices")
        .get(0)
        .path("message")
        .path("content")
        .asText("No response from AI");

    return ResponseEntity.ok(Map.of("text", text));

} catch(Exception e) {
    e.printStackTrace();
    return ResponseEntity.status(500).body(
        Map.of("error", e.getMessage())
    );
}
    }
}