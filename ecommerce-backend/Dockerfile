# Stage 1 — Build
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app
# Copy pom.xml trước — Maven cache dependencies
# Lần sau build nếu pom.xml không đổi → CACHE LẠI THƯ VIỆN, KHÔNG BẮT TẢI LẠI
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# Thêm biến CACHEBUST để ép Docker build lại từ bước copy code trở xuống
ARG CACHEBUST=1
# Sau đó mới copy source code
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests
# Stage 2 — Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --retries=12 \
  CMD wget -q -O- http://localhost:8080/api/v1/categories || exit 1

ENTRYPOINT ["java","-jar","app.jar"]