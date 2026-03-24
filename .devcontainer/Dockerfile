# Use the stable 'bookworm' variant to ensure Feature compatibility
FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Install PostgreSQL client and openssl
RUN apt-get update && apt-get install -y postgresql-client openssl

# Set the workspace
WORKDIR /workspaces/auth-service