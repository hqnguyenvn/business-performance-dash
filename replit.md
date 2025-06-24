# Business Performance Dashboard

## Overview

This is a comprehensive business performance dashboard built with React, TypeScript, and Supabase. The application provides detailed analytics for business operations including revenue tracking, cost management, salary cost analysis, and performance reporting across multiple dimensions (customers, companies, divisions).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Routing**: React Router for client-side navigation
- **State Management**: React Query (TanStack Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Supabase real-time subscriptions (available but not extensively used)
- **API**: Direct Supabase client calls (no separate backend API layer)

## Key Components

### Data Management
- **Revenue Management**: Track revenue by customer, company, division, project, and currency
- **Cost Management**: Monitor various cost types including overhead and operational costs
- **Salary Cost Tracking**: Manage employee-related expenses with company and division breakdown
- **Exchange Rate Management**: Handle multi-currency revenue calculations

### Reporting System
- **Business Report**: Overall performance metrics with profit/loss analysis
- **Customer Report**: Performance analysis by customer segments
- **Company Report**: Company-wise performance breakdown
- **Division Report**: Division-level performance analytics

### User Management
- **Role-Based Access Control**: Admin, Manager, and User roles with different permissions
- **User Profile Management**: Profile information and role assignment
- **Authentication System**: Secure login/logout with remember me functionality

### Master Data Management
- **Settings Module**: Comprehensive management of all reference data
- **Data Import/Export**: CSV import/export functionality for bulk operations
- **Parameter Management**: System-wide configuration parameters

## Data Flow

1. **Authentication Flow**: Users authenticate through Supabase Auth, roles are checked via RLS policies
2. **Data Fetching**: React Query manages server state with optimized caching and background updates
3. **Real-time Updates**: Changes are reflected immediately through Supabase's real-time capabilities
4. **Data Processing**: Complex calculations (profit margins, tax calculations) are performed client-side
5. **Export Pipeline**: Data can be exported to CSV format with proper formatting and calculations

## External Dependencies

### Core Dependencies
- **@supabase/supabase-js**: Database and authentication client
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Headless UI components
- **react-router-dom**: Client-side routing
- **react-hook-form**: Form management
- **@hookform/resolvers**: Form validation
- **zod**: Schema validation
- **date-fns**: Date manipulation
- **lucide-react**: Icon library

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

### Database Dependencies
- **Drizzle ORM**: Type-safe database operations (configured but not actively used)
- **PostgreSQL**: Primary database through Supabase

## Deployment Strategy

### Environment Configuration
- **Development**: Local Vite server on port 5000
- **Production**: Static build served through Vite preview
- **Database**: Supabase hosted PostgreSQL instance

### Build Process
1. TypeScript compilation and type checking
2. Vite bundling with code splitting
3. Tailwind CSS purging and optimization
4. Asset optimization and compression

### Hosting
- **Platform**: Replit with autoscale deployment
- **Ports**: Internal port 5000, external port 80
- **Environment**: Node.js 20 with PostgreSQL 16 module

## Changelog
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.