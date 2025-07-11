# Nextjs SaaS Boilerplate

## Getting Started

Copy `.env.example` to `.env.development` and fill in the values.

## Development installation

This assumes you have a Mac with Apple Silicon.

```
# Install OS dependencies
brew install nvm
nvm install 22
nvm use 22
nvm alias default 22
brew install redis
brew install postgresql@14
brew install minio
# Install smoothmq
git clone https://gist.github.com/huksley/d88da22046c29d34d9193a602e3e6661 smoothmq
brew install --formula smoothmq/smoothmq.rb

# Init the postgres database first time
npm run prepg

# Prepare project to run
npm install

# Add environment variables
cp .env.example .env.development
# FIXME: Edit .env.development to suit your needs
npm run dev
```

## Prepare database first time and run migrations everytime schema changes

```
npm run migrate
```
