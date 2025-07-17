# Next.js + Stripe + Supabase Production-Ready Template

A production-ready Next.js template featuring authentication, dark mode support, Stripe integration, and a clean, modern UI. Built with TypeScript and Tailwind CSS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38B2AC)

📹 Full Video Guide: [youtube link](https://www.youtube.com/watch?v=ad1BxZufer8&list=PLE9hy4A7ZTmpGq7GHf5tgGFWh2277AeDR&index=8)

☕️ Buy me a coffee: [Cafe Latte](https://buy.stripe.com/5kA176bA895ggog4gh)

## ✨ Features

- 🔐 Authentication with Supabase
- 💳 Stripe payment integration
- 🌓 Dark mode support
- 📱 Responsive design
- 🎨 Tailwind CSS styling
- 🔄 Framer Motion animations
- 🛡️ TypeScript support
- 📊 Error boundary implementation
- 🔍 SEO optimized

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account
- A Stripe account
- A Google Cloud Platform account

### Installation and Setup

1. Clone the template:

```bash
git clone https://github.com/ShenSeanChen/launch-stripe-nextjs-supabase my-full-stack-app
cd my-full-stack-app
rm -rf .git
git init
git add .
git commit -m "Initial commit"
# git remote add origin https://github.com/ShenSeanChen/my-full-stack-app.git
git remote add origin https://github.com/USE_YOUR_OWN_GITHUB_NAME/my-full-stack-app.git
git push -u origin main
```

2. Install dependencies:
```bash
npm install
```
or
```bash
yarn install
```

3. Create .env.local with all variables from .env.example
```
NEXT_PUBLIC_APP_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI Configuration (you'll need to add your key)
OPENAI_API_KEY=

# Stripe Configuration
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_
NEXT_PUBLIC_STRIPE_BUTTON_ID=buy_btn_
# STRIPE_SECRET_KEY=sk_test_
STRIPE_SECRET_KEY=sk_live_
# STRIPE_WEBHOOK_SECRET=whsec_
STRIPE_WEBHOOK_SECRET=whsec_

# ANALYTICS
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

4. Set up Google Cloud Platform (GCP):
   - Create new OAuth 2.0 credentials in GCP Console
   - Configure authorized JavaScript origins
   - Configure redirect URIs
   - Save the Client ID and Client Secret

5. Configure Supabase:

   a. Get API Keys (Project Settings > API):
      - Project URL → NEXT_PUBLIC_SUPABASE_URL
      - Anon Public Key → NEXT_PUBLIC_SUPABASE_ANON_KEY
      - Service Role Secret → SUPABASE_SERVICE_ROLE_KEY
   
   b. Set up Authentication:
      - Go to Authentication > Providers > Google
      - Add your GCP Client ID and Client Secret
      - Update Site URL and Redirect URLs
   
   c. Database Setup:
      - Enable Row Level Security (RLS) for all tables
      - Create policies for authenticated users and service roles
      - Create the following trigger function:

      ```sql
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.users (id, email, created_at, updated_at, is_deleted)
        VALUES (NEW.id, NEW.email, NOW(), NOW(), FALSE);
        
        INSERT INTO public.user_preferences (user_id, has_completed_onboarding)
        VALUES (NEW.id, FALSE);
        
        INSERT INTO public.user_trials (user_id, trial_start_time, trial_end_time)
        VALUES (NEW.id, NOW(), NOW() + INTERVAL '48 hours');
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      ```

6. Set up Stripe:
   
   a. Create a live account and configure:
      - Create product in Product Catalog
      - Create promotional coupon codes
      - Set up Payment Link with trial period
   
   b. Get required keys:
      - Publishable Key → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      - Secret Key → STRIPE_SECRET_KEY
      - Buy Button ID → NEXT_PUBLIC_STRIPE_BUTTON_ID
   
   c. Configure webhooks:
      - Add endpoint: your_url/api/stripe/webhook
      - Subscribe to events: customer.subscription.*, checkout.session.*, invoice.*, payment_intent.*
      - Copy Signing Secret → STRIPE_WEBHOOK_SECRET

7. Setting Up Stripe Payment Links for Contact Credits:
   
   a. Create credit packages in Stripe:
      - Go to Stripe Dashboard > Products
      - Create three products:
        * Light Package ($19): 2,000 credits
        * Pro Package ($39): 6,000 credits
        * Ultra Package ($99): 20,000 credits
   
   b. Create payment links for each package:
      - Go to Stripe Dashboard > Products > Select Product > Payment links
      - For each product, create a payment link
      - Configure each link:
        * Set appropriate pricing (one-time purchase)
        * Enable customer email collection
        * Add custom fields (optional): client_reference_id (to store user ID)
        * Set success URL to: your_url/profile?payment=success
        * Set cancel URL to: your_url/pricing
   
   c. Update payment links in the code:
      - Open `app/pricing/page.tsx` and `components/PricingSection.tsx`
      - Update the `PAYMENT_LINKS` constant with your actual Stripe payment links:
        ```typescript
        const PAYMENT_LINKS = {
          light: "https://buy.stripe.com/your-light-payment-link",
          pro: "https://buy.stripe.com/your-pro-payment-link",
          ultra: "https://buy.stripe.com/your-ultra-payment-link"
        };
        ```
      - This approach guarantees the payment links are available at runtime with no dependency on environment variables

8. Start the development server:
```bash
npm run dev
```
or
```bash
yarn dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Project Structure

```
├── app/                  # Next.js 14 app directory
│   ├── api/              # API routes
│   │   ├── stripe/       # Stripe payment endpoints
│   │   └── user/         # User API endpoints
│   ├── auth/             # Auth-related pages
│   │   ├── callback/     # handle auth callback
│   ├── dashboard/        # Dashboard pages
│   ├── pay/              # Payment pages
│   ├── profile/          # User profile pages
│   ├── reset-password/   # Reset password pages
│   ├── update-password/  # Update password pages
│   ├── verify-email/     # Verify email pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── styles/               # Global styles
```

## 📱 Contact Credits System

The application uses a credit-based system for generating B2B contact databases:

### 🔑 Key Features

- **Free Starting Credits**: New users receive 20 free credits upon registration.
- **Credit Usage**: 1 credit = 1 contact record generation.
- **Credit Packages**:
  - Light Package: 2,000 credits for $19
  - Pro Package: 6,000 credits for $39
  - Ultra Package: 20,000 credits for $99
- **Credit Management**: Users can view their available and used credits in the Profile page.
- **Database Integration**: Credits are verified before database creation and deducted upon completion.

### 💾 Database Tables

The credits system uses two main tables:

1. **user_contact_credits**:
   - Tracks available and used credits per user
   - Created automatically for new users with initial free credits
   - Updated when users purchase packages

2. **credit_purchases**:
   - Records all credit package purchases
   - Stores purchase details including package name, credits amount, and Stripe payment IDs

### 🔄 Implementation Flow

1. **Purchase Flow**:
   - User selects a credit package on the Pricing page
   - User is redirected to Stripe for payment
   - Upon successful payment, Stripe webhook updates user's credits
   - User is redirected to Profile page showing updated credit balance

2. **Usage Flow**:
   - When creating a database, the system checks if user has sufficient credits
   - Upon database completion, credits are automatically deducted
   - Credits usage is displayed on the Profile page

The implementation leverages database triggers to handle credit management automatically, ensuring accurate tracking of credit balances and usage across the application.

## 🛠️ Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Supabase](https://supabase.com/) - Authentication & Database
- [Stripe](https://stripe.com/) - Payments
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 🔧 Configuration

### Tailwind Configuration

The template includes a custom Tailwind configuration with:
- Custom colors
- Dark mode support
- Extended theme options
- Custom animations

### Authentication

Authentication is handled through Supabase with support for:
- Email/Password
- Google OAuth
- Magic Links
- Password Reset

### Payment Integration

Stripe integration includes:
- Subscription management
- Trial periods
- Webhook handling
- Payment status tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for the deployment platform
- Tailwind CSS team for the utility-first CSS framework
- Supabase team for the backend platform
- Stripe team for the payment infrastructure

## 📫 Contact

X - [@ShenSeanChen](https://x.com/ShenSeanChen)

YouTube - [@SeanTechStories](https://www.youtube.com/@SeanTechStories)

Discord - [@Sean's Stories](https://discord.gg/TKKPzZheua)

Instagram - [@SeanTechStories](https://www.instagram.com/sean_tech_stories )

Project Link: [https://github.com/ShenSeanChen/launch-stripe-nextjs-supabase](https://github.com/ShenSeanChen/launch-stripe-nextjs-supabase)

## 🚀 Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/your-repo-name)

---

Made with 🔥 by [ShenSeanChen](https://github.com/ShenSeanChen)

## Database Generation Feature

The application includes a custom integration with Outscraper's Google Maps API to allow users to create custom business databases:

### Features

- Create databases by specifying:
  - Search query (e.g., "restaurants", "coffee shops")
  - Location (e.g., "Manhattan, NY, USA")
  - Result limits
  - Language preferences
  - Custom tags

- Database Management
  - View status (pending, processing, completed, failed)
  - Export results as JSON
  - Delete databases

### Setting Up Outscraper

1. Obtain an API key from [Outscraper](https://app.outscraper.com/)
2. Add your API key to `.env.local`:
   ```
   NEXT_PUBLIC_OUTSCRAPER_API_KEY=your-api-key-here
   ```

### Database Schema

The feature requires two database tables:
- `user_databases`: Stores database metadata and status
- `database_entries`: Stores actual data entries

Run the SQL commands from `database_tables.sql` in Supabase SQL editor to set up the required tables.

### How It Works

1. User creates a database through the form
2. System creates a record in `user_databases` with a "pending" status
3. API request is sent to Outscraper asynchronously
4. System polls for results regularly
5. Once complete, data is stored in `database_entries` table
6. User can export or delete the database from the dashboard

# Contact Credits System

The application uses a credit-based system for generating contacts through database creation. Here's how it works:

## Credit System Overview

- Users receive 20 free credits upon registration
- Each credit allows for generating one contact record
- Credits are deducted when a database search is completed
- Additional credits can be purchased through the Profile page

## Credit Packages

Three credit packages are available for purchase:

- **Light Package**: 2,000 credits for $19
- **Pro Package**: 6,000 credits for $39
- **Ultra Package**: 20,000 credits for $99

## Technical Implementation

The credit system is implemented using the following components:

### Database Tables

- `user_contact_credits`: Tracks available and used credits for each user
- `credit_purchases`: Records all credit purchase transactions

### Database Triggers

- `on_auth_user_created`: Automatically creates a credit record with 20 free credits for new users
- `check_credits_before_database`: Ensures users have enough credits before creating a database
- `on_database_completion`: Deducts credits when a database search is completed

### API Routes

- `/api/webhook/stripe`: Handles Stripe webhook events to process payments and add credits

### Integration with Database Generation

When creating a database, the system:
1. Checks if the user has enough credits
2. Creates the database with "pending" status
3. Initiates the Outscraper API call
4. Deducts credits based on actual results when the search completes
5. Updates the user's credit balance

## Setting Up Stripe for Credits

To configure the payment system:

1. Create three products in Stripe dashboard for the different credit packages
2. Create payment links for each package and get the "Buy Button" IDs
3. Add the IDs to your `.env.local` file:
   ```
   NEXT_PUBLIC_STRIPE_LIGHT_BUTTON_ID=buy_btn_light_package_id
   NEXT_PUBLIC_STRIPE_PRO_BUTTON_ID=buy_btn_pro_package_id
   NEXT_PUBLIC_STRIPE_ULTRA_BUTTON_ID=buy_btn_ultra_package_id
   ```
4. Set up a Stripe webhook pointing to `/api/webhook/stripe` with the following events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Add the webhook secret to your `.env.local` file:
   ```
   STRIPE_WEBHOOK_SECRET=your-webhook-secret
   ```

## Database Migration

To migrate from the subscription-based system to the credit-based system, run the SQL script in `schema_updates.sql`. This will:

1. Create the new credit-related tables
2. Set up triggers and policies
3. Create credits for existing users
4. Remove the legacy subscription tables
