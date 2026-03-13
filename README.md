# DBOS Workflows Admin

A Next.js admin UI for [DBOS](https://docs.dbos.dev/) durable workflows: list, view, and debug workflows from one dashboard. Connect to one or more DBOS system databases and manage workflows across them.

![DBOS Admin – Workflows](docs/screenshot_1.png)

---

## Quick start

1. **Copy the environment file and configure at least one database:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add at least one line:

   ```bash
   DBOS_DATABASE_MyApp=postgresql://user:password@localhost:5432/my_dbos_db
   ```

   Replace `MyApp` with any label you want to see in the UI (e.g. `Production`, `Staging`). The value is the same Postgres connection string your DBOS application uses for its system database.

2. **Install and run:**

   ```bash
   pnpm install
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000). If you have multiple databases, choose one from the selector; then use the dashboard.

---

## Configuration

All configuration is done via environment variables. Use `.env.local` for local development (and ensure it is in `.gitignore`).

### Databases (required)

| Variable | Description |
|----------|-------------|
| `DBOS_DATABASE_<Name>` | Postgres URL for a DBOS system database. `<Name>` is the label shown in the UI (e.g. `MyPage`, `Astraia`, `Production`). You can define multiple databases; each appears as an option in the dashboard. |

**Examples:**

```bash
# Single database
DBOS_DATABASE_MyPage=postgresql://postgres:postgres@localhost:5432/my_page_dbos

# Multiple databases (different apps or environments)
DBOS_DATABASE_MyPage=postgresql://postgres:postgres@localhost:5432/my_page_dbos
DBOS_DATABASE_Staging=postgresql://postgres:postgres@staging.example.com:5432/dbos_staging
```

The app reads all env vars starting with `DBOS_DATABASE_`; the part after the prefix becomes the display name. Users pick the active database in the UI; the choice is stored in a cookie.

### Dashboard access (optional)

| Variable | Description |
|----------|-------------|
| `ADMIN_SECRET` | If set, users must enter this secret on the login page to access the dashboard. If unset or empty, the dashboard is open (no login). |

**Example:**

```bash
ADMIN_SECRET=your-secret-here
```

Use a strong secret in production so only authorized users can view workflow data.

### Custom workflow filters (optional)

You can add filters that match workflow **input** fields (e.g. by user ID or order ID). Each filter is defined by an env var and a comma-separated list of input field names to match.

| Variable | Description |
|----------|-------------|
| `DBOS_CUSTOM_FILTER_<Label>` | Comma-separated list of input field names. `<Label>` becomes a filter in the UI (e.g. `USER_ID` → “User Id”, `ORDER` → “Order”). The UI shows a text box; workflows whose input contains that value in any of the listed fields are shown. |

**Examples:**

```bash
# Filter by user (matches workflow inputs with userId or user_id)
DBOS_CUSTOM_FILTER_USER_ID=userId,user_id

# Filter by order (matches orderId, order_id, or order)
DBOS_CUSTOM_FILTER_ORDER=orderId,order_id,order
```

The match is case-sensitive and looks at the workflow input (and nested objects/arrays) for the configured field names.

---

## Using the dashboard

- **Database selector** – If multiple databases are configured, choose the one to inspect. The selection is remembered in your browser.
- **Dashboard** – Links to Workflows and Queued views.
- **Workflows** – Paginated list with filters (status, workflow name, and any custom filters you configured). Click a workflow ID to open its detail page.
- **Workflow detail** – Metadata, input/output/error, steps table, and actions: **Cancel**, **Resume**, **Fork from step**. Includes a replay hint for VS Code.
- **Queued** – Workflows currently in queues (PENDING/ENQUEUED).

---

## Example `.env.local`

```bash
# At least one database (required)
DBOS_DATABASE_MyPage=postgresql://postgres:postgres@localhost:5432/my_page_dbos

# Optional: require a secret to access the dashboard
# ADMIN_SECRET=your-secret-here

# Optional: filter workflows by input fields
# DBOS_CUSTOM_FILTER_USER_ID=userId,user_id
# DBOS_CUSTOM_FILTER_ORDER=orderId,order_id,order
```

---

## Tech

- Next.js 16 (App Router), TypeScript, Tailwind CSS.
- Uses `@dbos-inc/dbos-sdk` `DBOSClient` against the DBOS system database; no separate DBOS REST API required.
