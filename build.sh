#!/bin/bash
# Build the admin application
mvn clean package

# Build the public map application
mvn package -Pfrontend-map -DfinalName=ventureplatform-map-1.0
