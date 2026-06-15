#!/usr/bin/env node

/**
 * Genera una API key aleatoria de 64 caracteres hex (32 bytes)
 * para proteger el endpoint del cron de tasas de cambio.
 *
 * Uso:
 *   npm run generate-exchange-rates-api-key
 *
 * Pasos posteriores:
 *   1. Copia el valor de CRON_API_KEY a tu .env.local
 *   2. Añádelo en Vercel (o tu host) como variable de entorno de servidor
 *   3. Úsalo en el header x-api-key del cron SQL de Supabase:
 *        headers := jsonb_build_object('x-api-key', 'TU_KEY_AQUÍ')
 */

const crypto = require("crypto");

const apiKey = crypto.randomBytes(32).toString("hex");

console.log("\n✅ API key generada:\n");
console.log(`CRON_API_KEY=${apiKey}`);
console.log("\nCopia esta línea en tu .env.local y en Vercel → Environment Variables.\n");
