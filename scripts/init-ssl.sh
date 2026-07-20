#!/bin/bash
# ==========================================
# Self-signed SSL sertifikat generatsiyasi
# ==========================================
# Bu skript local development uchun 
# self-signed SSL sertifikat yaratadi
# ==========================================

set -e

DOMAIN="${DOMAIN:-localhost}"
SSL_DIR="/etc/nginx/ssl"
DAYS=3650  # 10 years for dev

echo "🔐 Generating self-signed SSL certificate for: $DOMAIN"

mkdir -p "$SSL_DIR"

# Generate private key
openssl genrsa -out "$SSL_DIR/privkey.pem" 2048 2>/dev/null

# Generate CSR (Certificate Signing Request)
openssl req -new -key "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/csr.pem" \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=Offline Khiso/OU=IT/CN=$DOMAIN" 2>/dev/null

# Generate self-signed certificate
openssl x509 -req -days $DAYS \
  -in "$SSL_DIR/csr.pem" \
  -signkey "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/fullchain.pem" 2>/dev/null

# Generate DH parameters (for Perfect Forward Secrecy)
# Using -dsaparam for ~10x faster generation (still crypto-safe)
openssl dhparam -dsaparam -out "$SSL_DIR/dhparam.pem" 2048 2>/dev/null || true

# Set proper permissions
chmod 600 "$SSL_DIR/privkey.pem"
chmod 644 "$SSL_DIR/fullchain.pem"
[ -f "$SSL_DIR/dhparam.pem" ] && chmod 644 "$SSL_DIR/dhparam.pem"

# Clean up CSR
rm -f "$SSL_DIR/csr.pem"

echo "✅ SSL certificate generated successfully!"
echo "   Location: $SSL_DIR/"
echo "   Domain:   $DOMAIN"
echo "   Expires:  $(openssl x509 -enddate -noout -in $SSL_DIR/fullchain.pem | cut -d= -f2)"
