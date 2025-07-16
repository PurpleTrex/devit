@echo off
echo Testing database connection...

cd frontend

echo Checking Prisma configuration...
npx prisma validate

echo.
echo Generating Prisma client...
npx prisma generate

echo.
echo Testing database connection...
npx prisma db push --accept-data-loss

echo.
echo Running seed script...
npm run db:seed

echo.
echo Database setup complete!
echo You can now run: npm run dev

pause
