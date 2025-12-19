# Next.js SaaS Boilerplate

A modern, production-ready SaaS boilerplate built with Next.js 15, React 19, TypeScript, Prisma, and Tailwind CSS.

## ✨ Features

- **Next.js 15** with Pages Router and React 19
- **Authentication** with NextAuth.js (Email, Google OAuth, Github OAuth support)
- **Database** with Prisma ORM and PostgreSQL
- **Email** with Nodemailer, React Email and Mailpit
- **Storage** with AWS S3 (compatible with MinIO for local development)
- **Queue System** with BullMQ and Redis
- **UI Components** with Radix UI and Tailwind CSS
- **Form Handling** with React Hook Form and Zod validation
- **Code Quality** with ESLint, Prettier, and Husky
- **Testing** with Jest and TypeScript
- **Analytics** with Plausible Analytics (optional)

## 🚀 Quick Start

## 📦 Operating System Setup (macOS)

For macOS users with Homebrew:

```bash
# Install Node.js with NVM
brew install nvm
nvm install 22
nvm use 22
nvm alias default 22

# Install required services
brew install redis
brew install postgresql@14
brew install minio

# Optional: Install MailHog for email testing
brew install mailhog
```

### 🚀 Getting started

1. **Fork the repository**

Go to Github repo https://github.com/wizecore/boilerplate-saas
and press "Use this template".

```bash
git clone https://github.com/<user>/boilerplate-saas.git
cd boilerplate-saas
```

2. Install all packages via homebrew (MacOS)

   ```bash
   brew install postgresql@14 redis minio mailpit
   ```

3. **Install packages**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env.development
   ```

   Edit `.env.development` and fill in your configuration values.

5. **Initialize PostgreSQL database**

   ```bash
   npm run prepg
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Run database migrations** (in separate terminal)
   ```bash
   npm run migrate
   ```

This will start:

- Next.js dev server on http://localhost:3000
- PostgreSQL database
- Redis server
- MinIO S3-compatible storage on http://localhost:9000
- Mailpit email testing server on http://localhost:8026

## 🛠️ Available Scripts

- `npm run dev` - Start development server with all services
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run migrate` - Run database migrations

### Individual Services

- `npm run pg` - Start PostgreSQL
- `npm run redis` - Start Redis
- `npm run minio` - Start MinIO S3 storage
- `npm run mail` - Start MailHog email server
- `npm run next` - Start Next.js only

## 📁 Project Structure

```
├── components/          # React components
├── lib/                 # Utility functions and backend
├── pages/               # Page router pages and api routes
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── types/               # TypeScript type definitions
├── .env.example         # Environment variables template
├── .env.development     # Local development config (never add this to git!)
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 🔐 Environment Variables

See `.env.example` for all available configuration options. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL
- `S3_*` - S3/MinIO storage configuration
- `SMTP_*` - Email server configuration

## 🗄️ Database Migrations

When you change the Prisma schema:

```bash
npm run migrate
```

This will:

1. Create a new migration
2. Apply it to your database
3. Regenerate the Prisma client

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Watch mode for development:

```bash
npm run test:watch
```

## 🚢 Production Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the production server:
   ```bash
   npm run start
   ```

## 🤝 Contributing

This is a boilerplate template. Feel free to customize it for your needs.
