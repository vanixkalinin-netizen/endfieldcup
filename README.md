# Endfield Cups

Турнирный сайт для `Arknights: Endfield`, собранный в стиле тёмного индустриального интерфейса с синим акцентом по мотивам `bc-endfield.goyfield.moe`.

Что уже реализовано:

- публичная главная страница со списком событий;
- регистрация по нику, почте и паролю;
- подтверждение аккаунта шестизначным кодом из письма;
- личный кабинет игрока с заявками;
- отдельная админ-панель для создания событий и просмотра заявок;
- SQLite-база и сид стартового администратора.

## Стек

- Next.js 16
- React 19
- Tailwind CSS 4
- Prisma Client 7
- SQLite
- Nodemailer

## Быстрый старт

1. Установить зависимости:

```bash
npm install
```

2. Настроить переменные окружения:

```bash
copy .env.example .env
```

3. Подготовить SQLite и стартовые данные:

```bash
npm run db:setup
npm run db:seed
```

`db:setup` uses the official Prisma flow: `prisma db push` and then `prisma generate`.

4. Запустить проект:

```bash
npm run dev
```

5. Открыть:

```text
http://localhost:3000
```

## Администратор по умолчанию

Если не меняли `.env`, после `npm run db:seed` доступен такой админ:

- email: `admin@endfield.local`
- password: `Admin123!`

## Почтовое подтверждение

Для реальной отправки писем заполните SMTP-переменные в `.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Если SMTP не настроен, сайт всё равно работает локально и показывает `DEV CODE` после регистрации, чтобы можно было проверить сценарий подтверждения без почтового сервера.
