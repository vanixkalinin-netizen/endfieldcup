# Railway deploy notes

This project can be deployed to Railway without changing the database layer.

## Required Railway setup

1. Deploy this repository as a Node service.
2. Attach a Volume to the service.
3. Mount the Volume at:

```text
/app/prisma
```

This is required because the app uses SQLite and writes to `./prisma`.

## Required variables

Set these variables in Railway:

```env
DATABASE_URL=file:./prisma/prod.db
AUTH_SECRET=replace-with-a-long-random-secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=smtp-user
SMTP_PASS=smtp-password
SMTP_FROM=Arknights Endfield Cups <noreply@example.com>
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_ADMIN_NICKNAME=Admin
```

## Runtime behavior

- `railway.toml` sets the start command to:

```text
npm run db:push && npm run start
```

- `db:push` is done at start time because Railway Volumes are mounted at runtime.

## First deploy

After the first successful deploy, run this once in the Railway service shell:

```bash
npm run db:seed
```

This creates or updates the admin account.
