# TeamSpace SaaS Starter 🚀

A modern, multi-tenant SaaS starter template built with **Next.js 16**, **Prisma 7**, **NextAuth v5**, and **Stripe**. 

TeamSpace provides a complete foundation for building a B2B SaaS product, featuring a fully functional Kanban board, team member management, robust role-based access control (RBAC), and integrated billing.

---

## ✨ Features

- **Multi-Tenant Architecture**: Complete data isolation with organization-scoped queries (`tenantDb()`).
- **Authentication**: NextAuth v5 (Beta) with Credentials and JWT strategies.
- **Kanban Board**: Interactive drag-and-drop workspace boards with Todo, In Progress, and Done lanes.
- **Team Management**: Invite members via email, manage roles (Owner, Admin, Member), and enforce plan limits.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions (e.g., only Owners can delete workspaces or edit organization settings).
- **Stripe Billing Integration**: Upgrade to Pro, handle webhooks (upgrades, renewals, cancellations), and customer billing portal.
- **Responsive Dashboard**: Beautiful, responsive sidebar and data-rich overview with live task statistics.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Database ORM:** [Prisma 7](https://www.prisma.io/) with the `@prisma/adapter-pg` edge-compatible driver
- **Database:** PostgreSQL (Designed for serverless environments like Neon or Supabase)
- **Authentication:** [NextAuth v5 (Auth.js)](https://authjs.dev/)
- **Payments:** [Stripe](https://stripe.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Validation:** [Zod](https://zod.dev/)

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/your-username/saas-starter.git
cd saas-starter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Rename `.env.example` to `.env` and fill in the required values:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/saas_starter"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
APP_URL="http://localhost:3000"
```

### 4. Database Setup
Ensure your PostgreSQL instance is running, then push the schema:
```bash
npx prisma db push
```

### 5. Start the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 💳 Stripe Local Testing

To test billing features locally, you need the [Stripe CLI](https://stripe.com/docs/stripe-cli):

1. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```
2. **Forward Webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
3. **Update your `.env`:** Copy the `whsec_...` secret provided by the CLI into your `STRIPE_WEBHOOK_SECRET` variable.
4. **Trigger Events:**
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## ☁️ Deployment (Vercel)

This project is optimized for deployment on Vercel.

1. **Database:** You must use a cloud-hosted PostgreSQL database (like [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)). Update your `DATABASE_URL` with the connection string.
2. **Push to GitHub:** Push your code to a GitHub repository.
3. **Import to Vercel:** Create a new project on Vercel and import the repository.
4. **Environment Variables:** Add all production environment variables in the Vercel dashboard.
5. **Stripe Webhooks:** Go to the Stripe Dashboard, create a new webhook endpoint pointing to `https://your-domain.vercel.app/api/webhook`, and update the Vercel environment variables with the new signing secret.

---

## 🔒 Security Notes

- All tenant data access is routed through the `tenantDb(orgId)` helper to prevent cross-tenant data leaks.
- API routes verify the JWT token via `getToken()` in the Next.js Proxy (`src/proxy.ts`), ensuring edge compatibility without loading Node.js specific database clients.
- Organization slugs are auto-generated from the organization name to ensure uniqueness and prevent identity spoofing.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
