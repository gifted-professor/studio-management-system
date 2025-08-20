# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Studio management system (工作室管理系统) for member and order management with follow-up capabilities. Built with Next.js 14 App Router, Prisma ORM, and SQLite/PostgreSQL.

## Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint

# Database
npm run db:push            # Push schema changes to database
npm run db:migrate         # Run database migrations
npm run db:studio          # Open Prisma Studio GUI
npx prisma generate        # Generate Prisma client after schema changes

# Data Import
npm run import-excel       # Import Excel data using hardcoded path
```

## Architecture

### Core Data Models
- **Member**: Customer records with aggregated statistics (total orders, amount, last order date)
- **Order**: Detailed order tracking including financial data (cost, profit, profit rate) and refund handling
- **FollowUp**: Customer communication records with scheduling for next contact

### Key Architecture Patterns

**Database Layer**:
- Prisma ORM with global client singleton pattern (`src/lib/prisma.ts`)
- Automatic member statistics updates via aggregation queries
- Cascade deletes for data integrity

**API Layer**:
- Next.js API routes following RESTful patterns
- Member stats auto-calculation when orders change
- Bulk import functionality with duplicate prevention

**Frontend Architecture**:
- App Router with Chinese navigation (会员管理, 订单管理, 数据导入)  
- Radix UI components with Tailwind CSS
- Form handling with proper validation

### Excel Import System
The `scripts/import-excel.js` handles bulk data import:
- Expects specific Chinese column headers (姓名, 手机号, 单号, etc.)
- Creates members automatically, links orders by member name/phone
- Calculates profit margins and updates member statistics
- Hardcoded file path that needs manual updates

### Database Schema Notes
- Uses string enums instead of Prisma enums for flexibility
- Member status: "ACTIVE"/"INACTIVE"
- Order status: "PENDING"/"PAID"/"SHIPPED"/"COMPLETED"/"CANCELLED"
- FollowUp types: "PAYMENT_REMINDER"/"ORDER_INQUIRY"/"RETURN_INQUIRY"/"GENERAL"

## Environment Setup

Development uses SQLite (`file:./dev.db`), production typically PostgreSQL on Vercel.

Always run `npx prisma generate` after schema changes and `npm run db:push` to apply changes to database.