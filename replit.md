# Business Performance Dashboard

## Overview

This is a comprehensive business performance dashboard built with React, TypeScript, and Supabase. The application provides financial reporting, cost tracking, and business analytics for organizations to monitor revenue, costs, and profitability across different dimensions (customers, companies, divisions).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with Shadcn/ui component library
- **State Management**: React hooks and context for local state, React Query for server state
- **Routing**: React Router for navigation
- **Form Handling**: React Hook Form with validation

### Backend Architecture
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Supabase Auth with role-based access control
- **API**: Supabase auto-generated REST API
- **Real-time**: WebSocket support through Supabase

## Key Components

### Data Management
- **Revenue Tracking**: Multi-currency revenue management with exchange rates
- **Cost Management**: Overhead costs and salary costs tracking
- **Master Data**: Customers, companies, divisions, projects, resources management
- **Exchange Rates**: Currency conversion for multi-currency operations

### Reporting System
- **Business Reports**: Overall financial performance analysis
- **Customer Reports**: Customer-specific profitability analysis
- **Company Reports**: Company-level performance metrics
- **Division Reports**: Division-wise financial analysis

### User Management
- **Role-Based Access Control**: Admin, Manager, User roles
- **Authentication**: Email/password login with remember me functionality
- **User Profiles**: User information and role management

## Data Flow

1. **Data Entry**: Users input financial data (revenues, costs) through forms
2. **Processing**: System calculates derived metrics (profit, percentages, VND conversion)
3. **Storage**: Data persisted to PostgreSQL via Supabase
4. **Retrieval**: React Query manages data fetching with caching
5. **Presentation**: Data displayed in tables and summary cards with export capabilities

## External Dependencies

### Core Dependencies
- **Supabase**: Backend-as-a-Service for database, auth, and API
- **React Query**: Server state management and caching
- **Radix UI**: Headless UI components for accessibility
- **Shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build tooling
- **ESLint**: Code linting and formatting
- **Drizzle Kit**: Database migration management

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with Vite dev server
- **Production**: Built with Vite and served as static files
- **Database**: Hosted on Supabase cloud
- **Deployment**: Configured for Replit autoscale deployment

### Database Schema
- **Master Data Tables**: customers, companies, divisions, projects, etc.
- **Transaction Tables**: revenues, costs, salary_costs
- **Configuration Tables**: exchange_rates, parameters, user_roles
- **Security**: Row Level Security (RLS) policies for data access control

### Port Configuration
- **5000**: Main application port
- **5001**: Alternative frontend port
- **8080-8081**: Additional service ports

## Changelog

- June 24, 2025: Fixed deployment issues - corrected path-to-regexp errors, improved server initialization, and resolved route registration problems
  - Fixed path-to-regexp parameter validation syntax causing "Unexpected ( at 18" errors
  - Enhanced error handling around route registration to prevent server crashes during startup
  - Added startup health check with timeout to verify server is responding properly
  - Improved server error handling with proper port binding and crash loop prevention
  - Updated workflow configuration to run Express server instead of Vite-only for proper API handling
- June 24, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.