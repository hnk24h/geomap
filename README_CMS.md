# GeoPuzzle CMS (Prisma)

## 1) Environment

Create .env from .env.example and set your PostgreSQL connection string:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"

## 2) Initialize Prisma

1. npm run prisma:generate
2. npm run prisma:migrate -- --name init
3. npm run db:seed

## 3) Run app

npm run dev

Open:
- Game: /
- CMS: /admin

## Hierarchy

Admin now follows three levels:

1. Country
2. Province (inside selected country)
3. Local unit: District, Ward, City (inside selected province)

## 4) API endpoints

- GET/POST /api/admin/provinces
- PATCH/DELETE /api/admin/provinces/:id
- GET/POST /api/admin/districts
- PATCH/DELETE /api/admin/districts/:id

## 5) Notes

- Districts are cascade-deleted when deleting province.
- This CMS is a baseline and currently has no auth middleware yet.
- For production, add auth/roles and audit logs.
