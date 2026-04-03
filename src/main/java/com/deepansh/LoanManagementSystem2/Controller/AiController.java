package com.deepansh.LoanManagementSystem2.Controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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

    String groqBody = "{"
        + "\"model\":\"llama-3.1-8b-instant\","
        + "\"messages\":[{\"role\":\"user\",\"content\":\""
        + prompt.replace("\"", "\\\"").replace("\n", "\\n")
        + "\"}],"
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