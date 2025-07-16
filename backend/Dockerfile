# Build stage
FROM rustlang/rust:nightly AS builder

WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies without SQLx compile-time checking
ENV SQLX_OFFLINE=false
RUN cargo build --release
RUN rm src/main.rs

# Copy source code and migrations
COPY src ./src
COPY migrations ./migrations

# Build the application without SQLx compile-time checking
ENV SQLX_OFFLINE=false
RUN touch src/main.rs && cargo build --release

# Runtime stage for AlloyDB
FROM debian:bookworm-slim AS runner

# Install runtime dependencies including Cloud SQL Proxy
RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download and install Cloud SQL Proxy for AlloyDB connection
RUN curl -o /usr/local/bin/cloud_sql_proxy \
    https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 \
    && chmod +x /usr/local/bin/cloud_sql_proxy

# Create non-root user
RUN useradd --create-home --shell /bin/bash devit

WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/target/release/devit-backend ./devit-backend

# Copy migrations
COPY --from=builder /app/migrations ./migrations

# Create startup script for AlloyDB connection
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start Cloud SQL Proxy if enabled\n\
if [ "$USE_CLOUD_SQL_PROXY" = "true" ]; then\n\
    echo "Starting Cloud SQL Proxy for AlloyDB..."\n\
    cloud_sql_proxy -instances=$GCP_PROJECT_ID:$ALLOYDB_REGION:$ALLOYDB_CLUSTER_ID=tcp:5432 &\n\
    \n\
    # Wait for proxy to be ready\n\
    echo "Waiting for Cloud SQL Proxy to be ready..."\n\
    for i in {1..30}; do\n\
        if nc -z localhost 5432; then\n\
            echo "Cloud SQL Proxy is ready!"\n\
            break\n\
        fi\n\
        echo "Waiting for Cloud SQL Proxy... ($i/30)"\n\
        sleep 2\n\
    done\n\
    \n\
    if ! nc -z localhost 5432; then\n\
        echo "Failed to connect to Cloud SQL Proxy"\n\
        exit 1\n\
    fi\n\
fi\n\
\n\
echo "Starting DevIT Backend..."\n\
exec ./devit-backend' > /app/start.sh \
    && chmod +x /app/start.sh

# Install netcat for health checks
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Change ownership
RUN chown -R devit:devit /app

USER devit

EXPOSE 8080

# Health check for AlloyDB connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENV RUST_LOG=info

# Use the startup script that handles AlloyDB connection
CMD ["/app/start.sh"]
