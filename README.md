# Sales RCA Dashboard

A comprehensive sales performance management dashboard built with modern web technologies, providing real-time insights into revenue, sales team performance, and critical business alerts.

## Project info

**URL**: https://lovable.dev/projects/7b2335a9-9271-41a9-95e1-a05290a75ea0

## Features

- **Revenue Analytics**: Track revenue performance against targets with interactive visualizations
- **Sales Team Performance**: Monitor individual and team performance metrics
- **Critical Alerts**: Identify high-risk deals and potential revenue threats
- **Interactive Filtering**: Advanced date range slider and sales manager filters
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Real-time Data**: Connected to Supabase for live data updates

## Dashboard Components

- **Overview Metrics**: Key performance indicators with trend analysis
- **Interactive Charts**: Revenue and deal size visualization with modal popups
- **Critical Alerts Panel**: High-priority deals requiring attention
- **Advanced Filters**: Date range slider and manager selection with reset functionality

## Local Development

### Prerequisites
- Node.js (v16 or later) and npm
- [Supabase](https://supabase.com) account (for your own database instance)

### Setup Instructions

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the project root
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Replace the values with your actual Supabase project credentials

4. **Start the development server**
   ```sh
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

### Using Lovable (Alternative)

You can also edit this project directly through the [Lovable Project](https://lovable.dev/projects/7b2335a9-9271-41a9-95e1-a05290a75ea0) interface.

## Environment Variables

The following environment variables are required for the application to function:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

⚠️ **Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7b2335a9-9271-41a9-95e1-a05290a75ea0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript development
- **React 18** - Modern React with hooks and functional components
- **Supabase** - Backend-as-a-Service for database and edge functions
- **shadcn/ui** - Modern, accessible UI component library
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Recharts** - Interactive chart library for data visualization
- **Lucide React** - Beautiful, customizable icons

## Database Schema

The dashboard connects to a Supabase database with the following key tables:
- `sales_reps` - Sales representative information and hierarchy
- `revenue` - Revenue transactions and participation dates
- `targets` - Sales targets by representative and time period
- `deals_current` - Current deal status and risk assessment
- `customers` - Customer information and lifecycle stages
- `events` - Sales activities and interactions

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7b2335a9-9271-41a9-95e1-a05290a75ea0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
