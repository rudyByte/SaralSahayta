import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function run() {
  try {
    const sql = fs.readFileSync('scripts/align_document_schema.sql', 'utf8');
    await prisma.$executeRawUnsafe(sql);
    console.log('Successfully executed align_document_schema.sql');
  } catch (error) {
    console.error('Failed to execute SQL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
