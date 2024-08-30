#!/bin/sh

# Debug: Print current directory and list files
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Debug: Print Prisma version
echo "Prisma version:"
npx prisma --version

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Debug: List migrations
echo "Available migrations:"
npx prisma migrate list

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
node dist/server.js