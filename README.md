# Julklappsdragning

Next.js-app för hemlig julklappsdragning med Supabase Postgres.

## Lokalt

```bash
cp .env.example .env.local
npm install && npm run generate:icons
# Kör supabase/migrations/001_juldragning.sql i Supabase SQL Editor
npm run dev
npm test && npm run build
```

## Miljövariabler (Vercel)

| Variabel | Beskrivning |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (endast server) |
