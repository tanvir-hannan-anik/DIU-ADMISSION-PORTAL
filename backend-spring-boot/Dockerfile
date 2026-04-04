FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY backend-spring-boot/pom.xml .
RUN mvn dependency:go-offline -B
COPY backend-spring-boot/src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
