# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

ARG APP_VERSION=1.0
ARG BUILD_NUMBER=local
ARG GIT_COMMIT=unknown
ENV APP_VERSION=${APP_VERSION} \
    BUILD_NUMBER=${BUILD_NUMBER} \
    GIT_COMMIT=${GIT_COMMIT}

RUN useradd --system --no-create-home taskflow
COPY --from=build /app/target/taskflow-*.jar app.jar
USER taskflow
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
