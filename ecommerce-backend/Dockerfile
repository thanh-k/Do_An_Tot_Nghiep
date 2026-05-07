# Stage 1 — Build
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app
# Copy pom.xml trước — Maven cache dependencies
# Lần sau build nếu pom.xml không đổi → bỏ qua bước này
COPY pom.xml .
RUN mvn dependency:go-offline -B
# Sau đó mới copy source code
COPY src ./src
RUN mvn clean package -DskipTests
# Stage 2 — Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]