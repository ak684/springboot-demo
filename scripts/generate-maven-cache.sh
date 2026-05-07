#!/bin/bash
# Script to generate/update the Maven dependency cache for offline builds
# Usage: ./scripts/generate-maven-cache.sh

set -e

CACHE_DIR=".m2-cache"

echo "Generating Maven dependency cache..."

# Clean and resolve all dependencies to the local cache
rm -rf "$CACHE_DIR"

# Use clean compile to resolve all dependencies including parent POMs
mvn clean compile -Dmaven.repo.local="$CACHE_DIR" -DskipTests -Dskip.npm

# Also run dependency:go-offline to get additional transitive dependencies
mvn dependency:go-offline -Dmaven.repo.local="$CACHE_DIR" -DskipTests -Dskip.npm

# Resolve plugin dependencies
mvn dependency:resolve-plugins -Dmaven.repo.local="$CACHE_DIR"

# Verify the cache
JAR_COUNT=$(find "$CACHE_DIR" -name "*.jar" | wc -l | tr -d ' ')
CACHE_SIZE=$(du -sh "$CACHE_DIR" | cut -f1)

echo ""
echo "Cache generated successfully!"
echo "  Location: $CACHE_DIR"
echo "  JAR files: $JAR_COUNT"
echo "  Total size: $CACHE_SIZE"
echo ""
echo "To use offline:"
echo "  mvn clean compile -q -Dmaven.repo.local=./.m2-cache --offline -Dskip.npm"
