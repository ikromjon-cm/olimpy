FROM nginx:1.25-alpine

# Install openssl for certificate generation
RUN apk add --no-cache openssl bash

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Copy SSL init script
COPY ./scripts/init-ssl.sh /usr/local/bin/init-ssl.sh
RUN chmod +x /usr/local/bin/init-ssl.sh

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

EXPOSE 80 443

# Entrypoint
ENTRYPOINT ["/bin/bash", "-c", "\
  if [ ! -f /etc/nginx/ssl/fullchain.pem ]; then \
    echo 'SSL certificate not found, generating self-signed...'; \
    /usr/local/bin/init-ssl.sh; \
  fi; \
  echo 'Starting Nginx...'; \
  nginx -g 'daemon off;' \
"]
