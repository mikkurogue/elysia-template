# API Template

An opinionated REST API template built with modern TypeScript tooling.

## Stack

- **[Bun](https://bun.sh)** - Fast JavaScript runtime and package manager
- **[Elysia](https://elysiajs.com)** - Ergonomic web framework with end-to-end type safety
- **[Drizzle ORM](https://orm.drizzle.team)** - TypeScript ORM with zero overhead
- **[better-result](https://github.com/dmmulroy/better-result)** - Lightweight Result type with generator-based composition by the goat @dmmulroy
- **[evlog](https://www.evlog.dev)** - Structured wide-event logging

## Prerequisites

- [Bun](https://bun.sh) v1.3+
- [Docker](https://www.docker.com) (for PostgreSQL)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/mikkurogue/elysia-template.git
cd api-template
bun install
```

### 2. Set Up PostgreSQL

Start a PostgreSQL container:

```bash
docker run -d \
  --name api-template-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=api_template \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/api_template
JWT_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=development
```

### 4. Run Database Migrations

```bash
bun run db:push
```

### 5. Start the Development Server

```bash
bun run dev
```

The API will be available at `http://localhost:3000`.

## API Documentation

OpenAPI documentation is automatically generated and available at:

```
http://localhost:3000/openapi
```

## Project Structure

```
src/
├── index.ts              # Application entry point
├── database/
│   ├── index.ts          # Database connection
│   └── schema.ts         # Drizzle schema definitions
├── lib/
│   └── safe-read-env.ts  # Type-safe environment variable reader
├── middleware/
│   └── auth.ts           # JWT authentication middleware
└── routes/
    └── auth/
        ├── index.ts      # Auth route handlers
        ├── model.ts      # Request/response validation schemas
        └── service.ts    # Business logic with Result.gen()
```

## Architecture

This template follows a layered architecture:

1. **Routes** (`routes/*/index.ts`) - HTTP handlers, cookie management, response mapping
2. **Services** (`routes/*/service.ts`) - Pure business logic using `Result.gen()` for composable error handling
3. **Models** (`routes/*/model.ts`) - TypeBox schemas for request validation

### Error Handling Pattern

Services return `Promise<Result<T, E>>` for type-safe, composable error handling:

```typescript
// Service returns Promise<Result> using generator composition
static async login(credentials): Promise<Result<User, AuthError>> {
    return Result.gen(async function* () {
        const maybeUser = yield* Result.await(findUserByEmail(email));
        const user = yield* validateUserExist(maybeUser);
        const isValid = yield* Result.await(verifyPassword(...));
        if (!isValid) return Result.err({ _tag: "InvalidCredentials", ... });
        return Result.ok(user);
    });
}

// Route handler matches Result to HTTP response
const result = await AuthService.login(body);
result.match({
    ok: (user) => { /* success: set cookie, return user */ },
    err: (error) => {
        log.error(error.message, { _tag: error._tag });
        throw status(error.status, error.message);
    }
});
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run db:push` | Push schema changes to database |
| `bun run db:generate` | Generate a new migration from the current schema |
| `bun run db:migrate` | Apply migrations |
| `bun run db:studio` | Open Drizzle Studio GUI |

## License

MIT
