# Project Management SaaS

A SaaS project task management tool with separate admin and customer backends.

## Features

### Admin Backend
- Create and manage customers
- Create and manage projects
- Create and manage tasks
- Track time and costs
- Generate reports and analytics

### Customer Backend
- View assigned projects and tasks
- View time and cost summaries
- Comment on tasks

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Library**: Material UI
- **State Management**: React Context API
- **Routing**: React Router
- **Backend & Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd project-management
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up Supabase**

- Create a new project in [Supabase](https://supabase.com)
- Get your project URL and anon key from the API settings
- Run the database schema script:
  ```bash
  # First, copy the SQL from database/schema_safe.sql
  # Then, paste it into the Supabase SQL Editor and run it
  # This version uses IF NOT EXISTS for all table creations to avoid errors
  ```
- Set up Row Level Security (RLS) policies:
  ```bash
  # Generate the SQL for RLS policies
  node database/fix_rls_policies.js
  # Copy the output and run it in the Supabase SQL Editor at https://jyzoyfozkxukomylwrjd.supabase.co
  ```

4. **Configure environment variables**

- Copy the `.env.example` file to `.env`:
  ```bash
  cp .env.example .env
  ```
- Update the `.env` file with your Supabase credentials:
  ```
  REACT_APP_SUPABASE_URL=your_supabase_url_here
  REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
  ```

5. **Run the application**

```bash
npm start
# or
yarn start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Database Schema

### Customers
- id (UUID, PK)
- company_name (String)
- first_name (String)
- last_name (String)
- address (String)
- email (String)
- hourly_rate (Number)
- created_at (Timestamp)
- updated_at (Timestamp)

### Projects
- id (UUID, PK)
- customer_id (UUID, FK)
- name (String)
- description (String)
- status (Enum: not_started, in_progress, waiting, completed)
- total_hours (Number)
- total_cost (Number)
- created_at (Timestamp)
- updated_at (Timestamp)

### Tasks
- id (UUID, PK)
- project_id (UUID, FK)
- name (String)
- description (String)
- total_hours (Number)
- total_cost (Number)
- created_at (Timestamp)
- updated_at (Timestamp)

### Subtasks
- id (UUID, PK)
- task_id (UUID, FK)
- name (String)
- completed (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)

### Time Entries
- id (UUID, PK)
- task_id (UUID, FK)
- admin_id (UUID, FK)
- start_time (Timestamp)
- end_time (Timestamp)
- hours (Number)
- cost (Number)
- notes (String)
- manual_entry (Boolean)
- created_at (Timestamp)

### Comments
- id (UUID, PK)
- task_id (UUID, FK)
- user_id (UUID, FK)
- content (String)
- is_customer (Boolean)
- admin_notified (Boolean)
- created_at (Timestamp)

### User Roles
- id (UUID, PK)
- user_id (UUID, FK)
- role (String: admin, customer)
- created_at (Timestamp)

## Troubleshooting

### Database Issues

If you encounter database-related errors, check the `database/README.md` file for troubleshooting steps. Common issues include:

1. **Permission Denied for Table "users"**
   - This occurs when the RLS policy for the auth.users table is not set up correctly.
   - Run `node database/fix_rls_policies.js` and execute the generated SQL in Supabase.

2. **Row-Level Security Policy Violation for Table "customers"**
   - This happens when trying to create a customer without proper admin permissions.
   - First, run `node database/fix_rls_policies.js` and execute the generated SQL in Supabase.
   - Then, run `node database/check_admin_role.js` to check if your user has the admin role.
   - If needed, run `node database/fix_admin_role.js` to assign the admin role to your user.

3. **Admin Role Issues**
   - If you can't access admin features, check if your user has the admin role.
   - Run `node database/check_admin_role.js` to check your role.
   - Run `node database/fix_admin_role.js` to fix your role if needed.
   - Make sure to execute the generated SQL in the Supabase SQL Editor.

## License

[MIT](LICENSE)
