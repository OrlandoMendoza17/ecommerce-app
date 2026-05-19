#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error('Error: SUPABASE_PROJECT_ID not found in environment variables');
  console.error('Make sure you have a .env.local file with SUPABASE_PROJECT_ID=your_project_id');
  process.exit(1);
}

try {
  console.log(`Generating types for project: ${projectId}`);
  const command = `npx supabase gen types typescript --project-id ${projectId} > ./src/lib/database.types.ts`;
  execSync(command, { stdio: 'inherit' });
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error.message);
  process.exit(1);
}
