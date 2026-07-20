# Offline Khiso - Olimpiada Offline Bosqichi Platformasi

Maktab o'quvchilari uchun offlayn olimpiadalarni boshqarish, ro'yxatdan o'tkazish, to'lov qabul qilish va natijalarni e'lon qilish platformasi.

## 🚀 Texnologik Stak

### Backend
- **Framework**: NestJS 10+ (TypeScript)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache/Queue**: Redis 7
- **Auth**: JWT + Passport + Refresh Token
- **SMS**: Eskiz.uz
- **Payments**: Click + Payme
- **Files**: MinIO (S3-compatible)
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + Shadcn/UI
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx + SSL (Certbot)
- **CI/CD**: GitHub Actions

## 📁 Loyiha Tuzilishi

```
offline-khiso/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Autentifikatsiya (OTP + JWT)
│   │   ├── users/          # Foydalanuvchilar boshqaruvi
│   │   ├── olympiads/      # Olimpiadalar
│   │   ├── registrations/  # Arizalar (Race condition himoyalangan)
│   │   ├── payments/       # Click + Payme integratsiyasi
│   │   ├── attendance/     # Davomat (QR skanerlash)
│   │   ├── results/        # Natijalar va sertifikatlar
│   │   ├── admin/          # Admin panel
│   │   ├── proctor/        # Nazoratchi mobil interfeysi
│   │   ├── files/          # PDF generatsiya (Ticket/Certificate)
│   │   ├── locations/      # Binolar va xonalar
│   │   ├── prisma/         # Prisma client va service
│   │   ├── redis/          # Redis service
│   │   ├── sms/            # Eskiz.uz SMS
│   │   ├── common/         # Guards, Filters, Interceptors, Pipes
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   │   ├── (auth)/     # Auth pages (login, register)
│   │   │   ├── (dashboard)/# Student dashboard
│   │   │   ├── (admin)/    # Admin panel
│   │   │   ├── (proctor)/  # Proctor mobile interface
│   │   │   └── api/        # API routes
│   │   ├── components/     # UI Components
│   │   │   ├── ui/         # Base components (Button, Input, etc.)
│   │   │   ├── forms/      # Form components
│   │   │   ├── layout/     # Layout components
│   │   │   └── charts/     # Chart components
│   │   ├── lib/            # Utilities (api, utils)
│   │   ├── store/          # Zustand stores
│   │   ├── hooks/          # Custom hooks
│   │   └── types/          # TypeScript types
│   ├── public/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── nginx/                  # Nginx configs
│   ├── nginx.conf
│   └── conf.d/
├── docker/                 # Docker configs
├── docker-compose.yml      # Production
├── docker-compose.dev.yml  # Development
└── README.md
```

## 🛠 O'rnatish va Ishga Tushirish

### Talablar
- Docker 24+ & Docker Compose 2+
- Node.js 20+ (development uchun)
- PostgreSQL 16 (agar Docker ishlatilmasa)

### Production (Docker)

```bash
# 1. Repository ni klonlash
git clone <repo-url>
cd offline-khiso

# 2. Environment fayllarni sozlash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. .env fayllarini tahrirlash (kamida quyidagilarni o'zgartiring):
# - JWT_SECRET, JWT_REFRESH_SECRET (32+ belgi)
# - ESKIZ_EMAIL, ESKIZ_PASSWORD
# - CLICK_*, PAYME_* credentials
# - DATABASE_URL (agar tashqi PG ishlatilsa)

# 4. Docker konteynerlarni build va ishga tushirish
docker-compose up -d --build

# 5. Database migratsiyalarni ishga tushirish
docker-compose exec backend npx prisma migrate deploy

# 6. (Ixtiyoriy) Seed data yaratish
docker-compose exec backend npx prisma db seed
```

### Development

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Backend logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend

# Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend npx prisma studio
```

## 🔐 Muhim Environment O'zgaruvchilar

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/offline_khiso?schema=public

# JWT (32+ belgi, productionda kuchli parol ishlating!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# SMS (Eskiz.uz)
ESKIZ_EMAIL=your@email.com
ESKIZ_PASSWORD=your-password
ESKIZ_SENDER_ID=4546

# Click
CLICK_SERVICE_ID=xxx
CLICK_MERCHANT_ID=xxx
CLICK_SECRET_KEY=xxx

# Payme
PAYME_ID=xxx
PAYME_KEY=xxx
PAYME_TEST_MODE=true

# MinIO/S3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=offline-khiso
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 📚 API Dokumentatsiya

Swagger UI: `http://localhost:3000/api/docs`

### Asosiy Endpointlar

#### Auth
- `POST /api/auth/send-otp` - OTP yuborish
- `POST /api/auth/verify-otp` - OTP tekshirish
- `POST /api/auth/refresh` - Token yangilash
- `POST /api/auth/logout` - Chiqish
- `GET /api/auth/me` - Profil

#### Olympiads
- `GET /api/olympiads` - Faol olimpiadalar (public)
- `GET /api/olympiads/:id` - Batafsil
- `GET /api/olympiads/:id/available-locations` - Bo'sh joylar

#### Registrations
- `POST /api/registrations` - Ariza yaratish (race condition himoyalangan)
- `GET /api/registrations` - Mening arizalarim
- `GET /api/registrations/:id` - Ariza batafsil
- `POST /api/registrations/:id/ticket` - Chipta PDF
- `DELETE /api/registrations/:id` - Bekor qilish

#### Payments
- `POST /api/payments/click/prepare` - Click to'lov uchun tayyorlash
- `POST /api/payments/payme/create-receipt` - Payme chek yaratish
- Webhook: `POST /api/payments/click/complete`
- Webhook: `POST /api/payments/payme`

#### Attendance (Proctor)
- `POST /api/attendance/scan` - QR kod skanerlash
- `GET /api/attendance/olympiad/:id` - Olimpiada davomat
- `GET /api/attendance/olympiad/:id/stats` - Statistika

#### Results
- `GET /results/my-results` - Mening natijalarim
- `GET /results/registration/:id` - Ariza natijasi
- `GET /results/certificate/:id` - Sertifikat PDF

#### Admin
- `GET /admin/dashboard` - Dashboard statistika
- `GET /admin/users` - Foydalanuvchilar
- `GET /admin/registrations` - Barcha arizalar (filter bilan)
- `POST /admin/olympiads` - Olimpiada yaratish
- `POST /admin/locations` - Bino qo'shish
- `POST /admin/export/:olympiadId` - Excel eksport

## 🗄 Database Schema (Asosiy Modellar)

```prisma
User {
  id, phoneNumber, fullName, role (STUDENT|PROCTOR|ADMIN),
  schoolName, grade, region, district, parentPhone,
  isActive, lastLoginAt
}

Olympiad {
  id, title, subject, price, examDate, regEndDate,
  isActive, maxCapacity
}

Location {
  id, name, address, mapLink, rooms[]
}

Room {
  id, locationId, roomNumber, capacity, currentSeats
}

Registration {
  id, userId, olympiadId, locationId, roomId, seatNumber,
  status (PENDING|PAID|CANCELLED), lang, qrCodeToken
}

Payment {
  id, registrationId, provider (CLICK|PAYME), transactionId,
  amount, status (PENDING|SUCCESS|FAILED|CANCELLED)
}

Attendance {
  id, registrationId, status (REGISTERED|ATTENDED|ABSENT),
  proctorId, scannedAt
}

Result {
  id, registrationId, score, rank, certificateUrl
}
```

## 🔒 Xavfsizlik

- **Rate Limiting**: Throttler (100 req/min, auth 5 req/min)
- **CORS**: Faqat frontend domenidan
- **Helmet**: Security headers
- **JWT**: Access (15min) + Refresh (7kun) token
- **Password**: bcrypt (12 rounds) - admin/proctor uchun
- **SQL Injection**: Prisma ORM (parameterized queries)
- **Race Condition**: SERIALIZABLE isolation + SELECT FOR UPDATE

## 🧪 Testlar

```bash
# Backend unit tests
docker-compose exec backend npm run test

# E2E tests
docker-compose exec backend npm run test:e2e

# Coverage
docker-compose exec backend npm run test:cov
```

## 📦 Build va Deploy

### Production Build
```bash
# Backend
docker build -t offline-khiso-backend ./backend

# Frontend
docker build -t offline-khiso-frontend ./frontend
```

### Nginx SSL Setup (Certbot)
```bash
# SSL sertifikat olish
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
crontab -e
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📱 PWA Support

Frontend `next-pwa` bilan PWA sifatida sozlangan:
- Offline caching
- Install prompt
- Push notifications (kelajakda)

## 🤝 Hissa Qo'shish

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 Litsenziya

MIT License - batafsil `LICENSE` faylida.

## 📞 Aloqa

- **Email**: support@offline-khiso.uz
- **Telegram**: @offline_khiso_support
- **Website**: https://offline-khiso.uz

---

**Offline Khiso** - Olimpiada offlayn bosqichini professional boshqaring! 🏆