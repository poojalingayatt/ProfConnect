const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
  transactionOptions: {
    maxWait: 10000,   // Max time to wait for a transaction to start (ms)
    timeout: 15000,   // Max time for the entire transaction to complete (ms)
  },
});

module.exports = prisma;