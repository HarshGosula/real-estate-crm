# Real Estate CRM

Mini CRM for capturing, listing and managing buyer leads

**Stack:** Next.js (App Router) • TypeScript • Prisma • Supabase • Zod • NextAuth • PapaParse (CSV)

## Overview

A production-minded mini CRM for managing buyer leads in the real estate domain. The application provides comprehensive lead management with create, edit, view, delete operations, server-side rendered listing with pagination & filters, CSV import/export capabilities, ownership enforcement, audit history, and basic full-text search functionality.

### Key Features

- **Full CRUD Operations** - Create, read, update, and delete buyer leads with proper validation
- **Server-Side Rendering** - SSR listing with filters, pagination, and URL-synced state
- **CSV Import/Export** - Transactional CSV import with row-level error reporting and filtered export
- **Search & Filtering** - Basic full-text search on fullName, email, and notes with multiple filter options
- **Ownership Enforcement** - Users can only edit/delete their own leads with audit trail
- **Data Validation** - Zod validation shared across client/server and CSV operations
- **Accessibility** - Basic accessibility features including labels, focus management, and ARIA attributes

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** NextAuth.js with custom login/signup
- **CSV Processing:** PapaParse
- **Styling:** Tailwind CSS

## Data Model

### Buyers (Leads)
- `id` - UUID primary key
- `fullName` - String (2-80 characters)
- `email` - Email (optional)
- `phone` - String (10-15 digits, required)
- `city` - Enum: `Chandigarh|Mohali|Zirakpur|Panchkula|Other`
- `propertyType` - Enum: `Apartment|Villa|Plot|Office|Retail`
- `bhk` - Enum: `1|2|3|4|Studio` (conditional: required for Apartment/Villa)
- `purpose` - Enum: `Buy|Rent`
- `budgetMin` - Integer (INR, optional)
- `budgetMax` - Integer (INR, optional, must be ≥ budgetMin)
- `timeline` - Enum: `0-3m|3-6m|>6m|Exploring`
- `source` - Enum: `Website|Referral|Walk-in|Call|Other`
- `status` - Enum: `New|Qualified|Contacted|Visited|Negotiation|Converted|Dropped` (default: New)
- `notes` - Text (≤ 1,000 characters, optional)
- `tags` - String array (optional)
- `ownerId` - User ID (foreign key)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Buyer History (Audit Trail)
- `id` - UUID primary key
- `buyerId` - Foreign key to buyers
- `changedBy` - User ID who made the change
- `changedAt` - Timestamp
- `diff` - JSON object containing changed fields

## API Routes

### Buyer Management
- `GET /api/buyers` - List buyers with pagination, filters, and search
- `POST /api/buyers` - Create new buyer lead
- `GET /api/buyers/[id]` - Get buyer details
- `PUT /api/buyers/[id]` - Update buyer (with concurrency protection)
- `DELETE /api/buyers/[id]` - Delete buyer and related history

### Import/Export
- `POST /api/buyers/import` - Import buyers from CSV
- `GET /api/buyers/export` - Export filtered buyers to CSV

## Pages & Features

### 1. Buyer List (`/buyers`)
- **Server-side rendered** with real pagination (10 items per page)
- **URL-synced filters:** city, propertyType, status, timeline
- **Debounced search:** across fullName, email, and notes
- **Sortable columns:** Name, Phone, City, Property Type, Budget, Timeline, Status, Updated At
- **Default sorting:** updatedAt descending

### 2. Create Lead (`/buyers/new`)
- Comprehensive form with all buyer fields
- **Conditional validation:** BHK required only for Apartment/Villa
- **Budget validation:** budgetMax ≥ budgetMin when both present
- **Real-time validation** with Zod schemas

### 3. View & Edit (`/buyers/[id]`)
- Display all buyer information
- **Inline editing** with same validation rules
- **Concurrency control:** prevents overwrites with updatedAt checking
- **Audit history:** Shows last 5 changes with field-level diff

### 4. CSV Import/Export
- **Import:** Process up to 200 rows with detailed error reporting
- **Export:** Respects current filters and search parameters
- **Headers:** `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status`
- **Validation:** Per-row validation with transactional inserts
- **Error handling:** Clear feedback for validation failures and duplicates

## Local Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/HarshGosula/real-estate-crm/)
   cd real-estate-crm
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up Supabase**
   - Create a new project on [Supabase](https://supabase.com)
   - Get your database URL from Project Settings > Database
   - Note down your project URL and anon key

4. **Environment variables**
   Create a `.env.local` file in the project root:
   ```env
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-long-random-secret-key"
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

5. **Database setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Optional: View your database
   npx prisma studio
   ```

6. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

7. **Run tests**
   ```bash
   pnpm test
   # or
   npm test
   ```

## CSV Import/Export Format

### Sample CSV Structure
```csv
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
Parth Mehta,parth@example.com,9876543210,Chandigarh,Villa,3,Buy,5000000,7000000,0-3m,Website,"Prefers high floor","vip,premium",New
```

### Import Process
- **Validation:** Each row validated against Zod schema
- **Error reporting:** Row-by-row error details with field-level messages
- **Duplicate handling:** Email duplicates within CSV and existing database entries flagged
- **Transaction safety:** Only valid rows inserted in single transaction
- **Concurrency:** Import respects ownership rules

### Export Features
- **Filtered export:** Exports only currently filtered/searched results
- **Re-importable:** Generated CSV can be edited and re-imported
- **Consistent headers:** Matches import format exactly

## Authentication & Security

### Authentication
- **Custom login/signup** with email and password
- **Password hashing** using secure algorithms
- **Session-based authentication** via NextAuth.js
- **Protected routes** for all buyer management operations

### Authorization & Ownership
- **Read access:** All authenticated users can view all buyers
- **Write access:** Users can only edit/delete their own leads (`ownerId` enforcement)
- **Audit trail:** All changes tracked in `buyer_history` table
- **Concurrency protection:** Prevents data overwrites with timestamp validation

### Security Measures
- **Input validation:** Zod schemas on both client and server
- **Rate limiting:** Simple in-memory rate limiter for create/update operations
- **SQL injection prevention:** Prisma ORM with parameterized queries
- **XSS protection:** React's built-in XSS protection

## Design Decisions

### Server-Side Rendering (SSR)
- **Buyer listing page** uses SSR for proper SEO and initial load performance
- **URL state synchronization** ensures bookmarkable filtered views
- **Pagination and filtering** processed on server for accurate counts

### Validation Strategy
- **Shared Zod schemas** between client, server, and CSV import
- **Centralized validation logic** in `lib/validations/buyer.ts`
- **Enum mapping** handled in `lib/mappers/buyers.ts` for consistency

### Data Architecture
- **Audit trail** implementation for compliance and debugging
- **Soft deletes** could be added but hard deletes implemented for simplicity
- **Relational integrity** maintained through Prisma schema constraints

## Quality Features Implemented

### Testing
- ✅ **Unit test** for CSV validator using Vitest

### Performance & UX
- ✅ **Rate limiting** for API endpoints (in-memory implementation)
- ✅ **Debounced search** to prevent excessive API calls
- ✅ **Optimistic UI updates** where appropriate
- ✅ **Loading states** and proper error handling

### Accessibility
- ✅ **Labeled inputs** with proper form associations
- ✅ **Keyboard navigation** support
- ✅ **ARIA attributes** for form errors and modal dialogs
- ✅ **Focus management** in modals and form interactions
- ✅ **Error announcements** for screen readers

### Error Handling
- ✅ **Error boundary** component for graceful error recovery
- ✅ **Empty states** with helpful messaging
- ✅ **Form validation errors** with field-level feedback
- ✅ **API error handling** with user-friendly messages

## What's Implemented

### ✅ Core Features (Required)
- Complete CRUD operations with validation
- SSR listing with pagination, filters, and search
- CSV import/export with error handling
- Ownership enforcement and audit history
- Authentication and security measures
- Basic accessibility features
- Unit test for CSV validator
- Rate limiting implementation

### ✅ Nice-to-Have Implemented
- **Basic full-text search** on fullName, email, and notes

## File Structure

```
src/
├── app/
│   ├── buyers/                 # Buyer pages (list, new, [id])
│   │   ├── page.tsx           # SSR list with filters
│   │   ├── new/page.tsx       # Create form
│   │   └── [id]/page.tsx      # Edit/view details
│   ├── api/buyers/            # API routes
│   │   ├── route.ts           # GET (list) + POST (create)
│   │   ├── [id]/route.ts      # GET/PUT/DELETE individual
│   │   ├── import/route.ts    # POST CSV import
│   │   └── export/route.ts    # GET CSV export
│   ├── login/page.tsx         # Authentication pages
│   ├── signup/page.tsx
│   └── layout.tsx
├── components/                # React components
│   ├── BuyerListClient.tsx    # Client-side list functionality
│   ├── BuyerEditClient.tsx    # Edit form component
│   ├── ImportModal.tsx        # CSV import modal
│   └── ErrorBoundary.tsx      # Error boundary component
├── lib/                       # Utility functions
│   ├── validations/buyer.ts   # Zod schemas
│   ├── csv/buyers.ts          # CSV processing
│   ├── mappers/buyers.ts      # Enum/data mapping
│   └── prisma.ts              # Prisma client
├── test/                      # Test files
│   └── csv-validator.spec.ts  # Unit test
└── types/
    └── next-auth.d.ts         # NextAuth type extensions

prisma/
├── schema.prisma              # Database schema
└── migrations/                # Database migrations
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
