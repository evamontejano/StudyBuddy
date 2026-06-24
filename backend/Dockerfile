# ---- Stage 1: Build ----
# Uses the full JDK to compile and package the Spring Boot app
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom first (better Docker layer caching)
COPY mvnw mvnw.cmd ./
COPY .mvn .mvn
COPY pom.xml .

# Copy source code
COPY src src

# Build the JAR, skip tests (tests run in CI separately)
RUN chmod +x mvnw && ./mvnw package -DskipTests

# ---- Stage 2: Run ----
# Uses only the JRE (smaller image, no compiler needed)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/study-buddy-0.0.1-SNAPSHOT.jar app.jar

# Port the Spring Boot app listens on (overridden by SERVER_PORT env var on EB)
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
