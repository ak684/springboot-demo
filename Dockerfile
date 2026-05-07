# Use pre-built base image with cached dependencies
# Requires base image to exist - run build-base-image workflow first after merge
ARG BASE_IMAGE=ghcr.io/launchforce-ai/venture-impact-platform-base:latest
FROM ${BASE_IMAGE} AS build
WORKDIR /workspace

# Copy dependency files (needed for build even though deps are cached)
COPY pom.xml .
COPY checkstyle_config.xml .
COPY package.json package-lock.json ./

# Copy source code
COPY frontend ./frontend
COPY src ./src
COPY liquibase ./liquibase

# Build (dependencies already cached in base image)
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup --system --gid 1000 appuser && \
    adduser --system --ingroup appuser --uid 1000 --shell /bin/sh --home /home/appuser appuser && \
    mkdir -p /tmp/embedded-pg && \
    chown -R appuser:appuser /tmp/embedded-pg /app

COPY --from=build --chown=appuser:appuser /workspace/target/ventureplatform-1.0.jar app.jar

USER appuser

EXPOSE 9000
ENV PORT=9000
ENV JAVA_OPTS="-Xmx200m -Xms120m -XX:+UseSerialGC -XX:MaxMetaspaceSize=140m -Xss256k"

CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-9000} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-embedded-postgres} -jar app.jar"]
