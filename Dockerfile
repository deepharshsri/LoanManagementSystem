# Step 1 — Use Java 17
FROM eclipse-temurin:17-jdk-alpine

# Step 2 — Set working directory inside container
WORKDIR /app

# Step 3 — Copy built JAR file
COPY target/*.jar app.jar

# Step 4 — Open port 8080
EXPOSE 8080

# Step 5 — Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]