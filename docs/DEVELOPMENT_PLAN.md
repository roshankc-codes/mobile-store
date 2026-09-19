# Mobile Store E-Commerce Platform
## Development Plan

**Version:** V1.0  
**Status:** Implementation Plan  
**Target Market:** Nepal  
**Platform:** Responsive Next.js Web Application  
**Primary Stack:** Next.js + TypeScript + Supabase/PostgreSQL + Resend  
**Security Priority:** Critical

---

# 1. Purpose

This document converts the PRD, Technical Architecture, Database Specification, and Security Specification into an implementation sequence.

The project must be built incrementally.

Each phase has:

- Objective
- Work to complete
- Security requirements
- Testing requirements
- Git checkpoint
- Definition of Done

Do not skip directly to later phases because a later feature depends on earlier architecture.

---

# 2. Core Development Rules

## 2.1 Build in small verified increments

The development sequence is:

```text
Plan
  ↓
Implement
  ↓
Run type/lint checks
  ↓
Run tests
  ↓
Security review
  ↓
Manual verification
  ↓
Git commit
  ↓
Next phase
```

## 2.2 Never use frontend state as the source of truth

Frontend state is for presentation and user experience.

The server/database is authoritative for:

- Prices
- Stock
- Orders
- Payment status
- Delivery fees
- User roles
- Permissions

## 2.3 Security is implemented alongside features

Security is not a final-only phase.

Examples:

- RLS is implemented with database tables.
- Authorization is implemented with admin routes.
- Checkout concurrency tests are implemented with checkout.
- Upload validation is implemented with uploads.
- Rate limiting is implemented with sensitive endpoints.

The final security phase is a comprehensive audit, not the first security review.

---

# 3. Current Starting Point

The current repository already contains the V0 frontend and project documentation.

Expected important structure:

```text
D:\MobileStore
│
├── app/
├── components/
├── lib/
├── public/
├── package.json
├── pnpm-lock.yaml
├── next.config.mjs
├── tsconfig.json
├── .gitignore
│
├── PROJECT_AUDIT.md
│
└── docs/
    ├── PRD.md
    ├── TECHNICAL_ARCHITECTURE.md
    ├── DATABASE_SPECIFICATION.md
    ├── SECURITY_SPECIFICATION.md
    └── DEVELOPMENT_PLAN.md
```

The V0 frontend is a starting point, not the completed application.

Existing mock/static data must gradually be replaced with the production data layer.

---

# 4. Phase 0 — Repository and Baseline Verification

## Objective

Establish a clean and reproducible development baseline before changing application behavior.

## Tasks

1. Confirm Git repository is initialized.
2. Confirm working tree is clean.
3. Confirm package manager used by the project.
4. Install dependencies.
5. Run development server.
6. Run lint/type checks.
7. Run production build.
8. Review existing V0 warnings/errors.
9. Review `next.config.mjs`.
10. Review `tsconfig.json`.
11. Review `.gitignore`.
12. Confirm no secrets are committed.
13. Review existing dependencies.

## Security

Check specifically for:

- `typescript.ignoreBuildErrors`
- Public admin links
- Missing admin authorization
- Exposed secrets
- Unsafe environment variables
- Unnecessary dependencies
- Insecure configuration
- V0 scaffolding metadata that should not remain in production

Do not hide errors merely to make the build pass.

## Testing

Run the project's applicable commands, including:

```powershell
pnpm install
pnpm lint
pnpm build
```

If the project has tests:

```powershell
pnpm test
```

Use the scripts actually defined in `package.json`.

## Git checkpoint

```text
chore: establish clean development baseline
```

## Definition of Done

- Dependencies install successfully.
- Development server runs.
- Lint/type checks are understood and actionable.
- Build completes without silently ignored TypeScript errors.
- No secrets are committed.
- Existing V0 security findings are documented.

---

# 5. Phase 1 — Environment and Supabase Project Setup

## Objective

Create the application environments and establish secure Supabase connectivity.

## Tasks

Create/configure:

- Supabase project
- PostgreSQL database
- Supabase Auth
- Supabase Storage
- Local environment variables
- Separate staging environment if applicable

The staging environment must not use production customer/order data.

## Environment variables

Create a local environment file such as:

```text
.env.local
```

Never commit it.

Separate public and server-only variables correctly.

## Security

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
DATABASE_PASSWORD
```

or equivalent secrets to browser code.

Only values intentionally designed to be public may be exposed through client-side environment variables.

## Testing

Verify:

- Supabase connection
- Auth configuration
- Server-side access
- Client-side access uses only intended public credentials

## Git checkpoint

```text
chore: configure secure application environments
```

## Definition of Done

- Local environment works.
- Supabase project is reachable.
- Secrets are excluded from Git.
- Staging/production separation is understood.
- No server-only credential is imported into client code.

---

# 6. Phase 2 — Database Schema and Migrations

## Objective

Implement the database defined in `DATABASE_SPECIFICATION.md`.

## Tasks

Create migrations for:

- Users/profile data as specified
- Roles
- Categories
- Products
- Product images/media metadata
- Orders
- Order items
- Inventory transactions
- Payment records
- Shipping/delivery data
- Any supporting tables defined by the database specification

Use migrations rather than manually editing production schema.

## Database integrity

Implement:

- Primary keys
- Foreign keys
- NOT NULL constraints
- UNIQUE constraints
- CHECK constraints
- Appropriate indexes
- Referential integrity

## Security

RLS should be considered part of the schema implementation rather than a later add-on.

## Testing

Verify migrations from a clean database where practical.

Test:

- Required fields
- Foreign key behavior
- Duplicate constraints
- Invalid values
- Delete/update behavior

## Git checkpoint

```text
feat: add initial database schema
```

## Definition of Done

- Schema matches the database specification.
- Migration can be applied successfully.
- Constraints are working.
- Indexes required by the specification exist.
- No application logic depends on undocumented database behavior.

---

# 7. Phase 3 — RLS and Authorization Foundation

## Objective

Implement database-level authorization before exposing sensitive data through the application.

## Tasks

Implement RLS policies for:

- Customer data
- Products
- Orders
- Order items
- Inventory
- Payments
- Administrative data
- Other protected tables

Implement the role model:

```text
customer
staff
owner
```

or the exact roles specified by the database/PRD.

## Security

Test authorization independently of frontend visibility.

A user should not gain access by:

- Entering a URL manually
- Calling an API directly
- Modifying request data
- Modifying browser state

## Testing

Write tests for:

- Anonymous access
- Customer access
- Staff access
- Owner access
- Cross-user access
- Unauthorized mutations

## Git checkpoint

```text
feat: implement database authorization and RLS
```

## Definition of Done

- Protected tables have RLS.
- Policies follow least privilege.
- Cross-user access is denied.
- Role-based operations are enforced.
- RLS tests pass.

---

# 8. Phase 4 — Authentication

## Objective

Connect the frontend account flow to real authentication.

## Tasks

Implement the authentication flow defined in the PRD/architecture.

Integrate:

- Sign-in
- Sign-out
- Session handling
- Account state
- Protected customer functionality

## Security

Use secure session handling.

Do not:

- Store sensitive credentials in localStorage
- Trust frontend role information
- Expose service credentials

## Testing

Test:

- Successful authentication
- Invalid authentication
- Logout
- Session persistence
- Session expiration
- Unauthorized access

## Git checkpoint

```text
feat: implement authentication
```

## Definition of Done

- Authentication works.
- Session state is reliable.
- Protected customer functionality requires appropriate authentication.
- Authentication tests pass.

---

# 9. Phase 5 — Admin Authentication and Protected Admin Shell

## Objective

Turn the existing/admin frontend into a real protected dashboard.

## Tasks

Implement:

- Admin route protection
- Role checks
- Admin layout
- Admin navigation
- Owner/staff permission boundaries
- Protected server actions/API routes

Remove the insecure public/admin-only behavior identified during the initial audit.

## Security

The admin UI must not be the security boundary.

Authorization must be enforced server-side and through RLS.

Middleware may provide early route protection but must not replace server authorization.

## Testing

Attempt:

- Anonymous admin access
- Customer admin access
- Staff owner-only operation
- Direct URL access
- Direct API/server action access

## Git checkpoint

```text
feat: secure admin dashboard access
```

## Definition of Done

- Unauthorized users cannot access protected admin operations.
- Admin routes work for authorized users.
- Role boundaries are tested.

---

# 10. Phase 6 — Product and Category Management

## Objective

Replace mock product data with the real database.

## Tasks

Implement customer-side:

- Product listing
- Product detail
- Category listing
- Category pages
- Search
- Pagination/filtering as defined

Implement admin-side:

- Create product
- Edit product
- Archive/delete behavior as specified
- Category management
- Price management
- Stock visibility

## Security

Validate all product mutation inputs server-side.

Only authorized admin/staff users may mutate products.

Customers must never directly modify:

- Price
- Stock
- Internal product fields

## Testing

Test:

- Invalid product data
- Unauthorized mutations
- Product retrieval
- Search
- Category filtering
- Pagination

## Git checkpoint

```text
feat: connect storefront to product database
```

## Definition of Done

- Mock product data is no longer authoritative.
- Storefront reads from PostgreSQL.
- Admin product operations work.
- Authorization and validation work.

---

# 11. Phase 7 — Media Upload and Image Pipeline

## Objective

Implement secure product image uploads and optimization.

## Tasks

Implement:

- Product image upload
- Storage paths
- Image metadata
- Image replacement
- Image deletion according to the specification
- Image optimization
- Appropriate responsive image delivery

Support required formats such as:

- JPG/JPEG
- PNG
- Other formats explicitly approved by the architecture

## Security

Validate:

- File extension
- MIME type
- File signature where practical
- File size
- Image dimensions

Generate safe storage names.

Never use raw user filenames as storage paths.

Private files must remain protected.

## Architecture constraint

If Sharp is used, run it in a Node-capable environment.

Do not assume Sharp can run inside Cloudflare Workers.

Hosting/runtime decisions are intentionally deferred until the deployment phase.

## Testing

Test:

- Valid image
- Wrong MIME type
- Wrong extension
- Oversized image
- Malicious filename
- Unauthorized upload
- Unauthorized access
- Replacement/deletion authorization

## Git checkpoint

```text
feat: implement secure product media pipeline
```

## Definition of Done

- Product images upload securely.
- Storage policies work.
- Images are optimized.
- Unauthorized access is rejected.

---

# 12. Phase 8 — Cart Integration

## Objective

Make the existing frontend cart interact correctly with real products.

## Tasks

Implement:

- Add to cart
- Remove from cart
- Quantity changes
- Empty cart
- Stock-aware UI
- Cart persistence strategy

The cart is only a client-side convenience.

## Security

Never treat cart price or total as authoritative.

At checkout, the server re-reads product data.

## Testing

Test:

- Quantity limits
- Out-of-stock items
- Invalid product references
- Cart persistence
- Duplicate items
- Price changes after adding to cart

## Git checkpoint

```text
feat: integrate production cart behavior
```

## Definition of Done

- Cart UX works.
- Invalid quantities are prevented.
- Checkout does not trust client totals.

---

# 13. Phase 9 — Shipping and Delivery Rules

## Objective

Implement the delivery model defined for Nepal.

## Tasks

Implement the agreed shipping rules, such as:

- Delivery zones
- District/province rules
- Flat delivery
- Free-delivery threshold if applicable

Do not leave delivery calculation implicit.

## Security

Delivery charges must be calculated server-side.

## Testing

Test:

- Valid location
- Invalid location
- Delivery fee calculation
- Boundary cases
- Manipulated client delivery fee

## Git checkpoint

```text
feat: implement delivery calculation
```

## Definition of Done

- Delivery fee is deterministic.
- Server is authoritative.
- Checkout displays the correct fee.

---

# 14. Phase 10 — Checkout and Order Creation

## Objective

Implement secure production checkout.

## Tasks

Implement:

- Customer information
- Address
- Delivery method/zone
- Order creation
- Order items
- Final total
- COD/manual payment method as defined by V1
- Order confirmation

## Security

Never trust client:

- Price
- Stock
- Total
- Delivery charge
- Product title
- Payment state

Server must retrieve authoritative product records.

## Checkout sequence

Conceptually:

```text
Receive checkout request
        ↓
Authenticate/identify customer as required
        ↓
Validate input
        ↓
Load authoritative products
        ↓
Start transaction
        ↓
Lock required inventory/product rows
        ↓
Verify stock
        ↓
Calculate totals
        ↓
Create order
        ↓
Create order items
        ↓
Create inventory transaction(s)
        ↓
Commit
        ↓
Trigger allowed post-order actions
```

## Concurrency

Use PostgreSQL transactional protection and row-level locking where required.

Example:

```sql
SELECT ...
FOR UPDATE;
```

The exact SQL must follow the implemented schema.

## Testing

Must be written at this phase:

- Final-unit concurrent purchase
- Multiple concurrent checkouts
- Duplicate submission
- Out-of-stock
- Invalid quantity
- Manipulated price
- Manipulated total
- Invalid product

## Git checkpoint

```text
feat: implement secure transactional checkout
```

## Definition of Done

- Orders are created correctly.
- Totals are server-calculated.
- Inventory cannot be oversold.
- Concurrency tests pass.
- Invalid/malicious checkout requests are rejected.

---

# 15. Phase 11 — Inventory Management

## Objective

Implement the append-only inventory transaction model.

## Tasks

Implement:

- Stock increases
- Stock decreases
- Inventory history
- Adjustment workflow
- Stock calculation
- Admin inventory UI

Inventory history should remain auditable.

## Security

Customers cannot modify inventory.

Only authorized administrative operations may create valid inventory transactions.

Avoid destructive rewriting of historical inventory records unless explicitly required by the database specification.

## Testing

Test:

- Positive adjustment
- Negative adjustment where permitted
- Invalid adjustment
- Unauthorized adjustment
- Concurrent order/inventory operation
- Stock calculation

## Git checkpoint

```text
feat: implement inventory transaction management
```

## Definition of Done

- Inventory state is derived consistently.
- History is auditable.
- Unauthorized changes are blocked.
- Concurrency remains safe.

---

# 16. Phase 12 — Order Management

## Objective

Implement the admin order workflow.

## Tasks

Admin/staff functionality as permitted by role:

- View orders
- Filter orders
- Search orders
- View order details
- Update order status
- Add internal notes if specified
- Review payment state
- Process supported operational states

## Security

Customers cannot modify administrative order state.

Role boundaries must be enforced.

## Testing

Test:

- Order ownership
- Role permissions
- Invalid state transitions
- Unauthorized status updates
- Direct API/server-action attempts

## Git checkpoint

```text
feat: implement admin order management
```

## Definition of Done

- Admin can manage orders.
- Role permissions work.
- Order state changes are controlled.

---

# 17. Phase 13 — Manual Payment Verification

## Objective

Implement the V1 manual payment workflow if included by the PRD.

## Tasks

Implement:

- Payment record
- Payment proof upload
- Admin review
- Verification/rejection
- Payment status
- Audit information

## Security

Only authorized admin/staff roles may verify payment.

Payment proof must use protected storage policies.

## Testing

Test:

- Unauthorized verification
- Invalid proof
- Missing proof
- Duplicate verification
- Access to another user's proof
- State transitions

## Git checkpoint

```text
feat: implement secure payment verification
```

## Definition of Done

- Payment state is controlled.
- Proof is protected.
- Verification is auditable.

---

# 18. Phase 14 — Transactional Email

## Objective

Implement the V1 transactional email workflow using Resend or the provider finalized by the architecture.

## Tasks

Implement the required customer order emails defined by the PRD.

Potential lifecycle examples:

- Order placed
- Payment verified
- Order status updates

Only implement the events included in V1.

## Security

- API key remains server-side.
- Recipient is validated.
- Email-triggering operations are protected.
- Avoid duplicate/uncontrolled sends.
- Do not expose provider credentials.

## Testing

Test:

- Correct recipient
- Correct order information
- Failed provider response
- Duplicate trigger behavior
- Unauthorized triggering
- Rate limiting

## Git checkpoint

```text
feat: add transactional order emails
```

## Definition of Done

- Required V1 emails send successfully.
- Secrets remain server-side.
- Failure handling is safe.
- Email behavior is tested.

---

# 19. Phase 15 — Customer Account and Order History

## Objective

Connect the account page to real user/order data.

## Tasks

Implement:

- Customer profile
- Order history
- Order detail
- Relevant account settings

## Security

Customer A must never see Customer B's data.

Use both:

- Server authorization
- RLS

## Testing

Test:

- Own order access
- Cross-user order access
- Unauthenticated access
- Session expiration

## Git checkpoint

```text
feat: implement customer account and order history
```

## Definition of Done

- Account page uses real data.
- Order history is private to the customer.
- Authorization tests pass.

---

# 20. Phase 16 — Search, Filtering, and UX Completion

## Objective

Complete the customer storefront experience.

## Tasks

Review:

- Homepage
- Header
- Navigation
- Search
- Category pages
- Product pages
- Cart
- Checkout
- Account
- Footer
- Mobile experience
- Empty states
- Error states
- Loading states

## Security

Search/filter inputs must be validated and bounded.

## Testing

Test:

- Mobile layouts
- Desktop layouts
- Empty results
- Invalid routes
- Slow responses
- Loading states
- Error recovery

## Git checkpoint

```text
feat: complete storefront experience
```

## Definition of Done

- Customer journey is complete from product discovery to order confirmation.
- Responsive behavior works.
- No major mock data remains in production flows.

---

# 21. Phase 17 — Admin UX Completion

## Objective

Make the admin dashboard practical for the store owner/staff.

## Tasks

Complete:

- Dashboard
- Product management
- Categories
- Inventory
- Orders
- Payment verification
- Media management
- Relevant settings

Keep the interface simple enough for non-technical store staff.

## Security

Do not add UI shortcuts that bypass authorization.

## Testing

Perform role-based manual testing.

## Git checkpoint

```text
feat: complete admin workflows
```

## Definition of Done

- Owner can perform required V1 operations.
- Staff can perform only permitted operations.
- Sensitive actions are protected.

---

# 22. Phase 18 — Rate Limiting and Abuse Controls

## Objective

Finalize rate limiting after the sensitive endpoints are known.

## Tasks

Protect applicable:

- Authentication
- Checkout
- Order creation
- Payment proof upload
- Email sending
- Admin operations
- Search/API endpoints

Use the distributed-safe mechanism selected for the final deployment architecture.

## Testing

Test:

- Normal request
- Burst requests
- Rate-limit response
- Reset behavior
- Multiple instances if applicable

## Git checkpoint

```text
security: add rate limiting and abuse protection
```

## Definition of Done

- Sensitive endpoints have appropriate limits.
- `429` behavior works where applicable.
- Limits do not unnecessarily block normal customers.

---

# 23. Phase 19 — Error Handling and Observability

## Objective

Make failures safe, understandable, and diagnosable.

## Tasks

Implement:

- User-friendly errors
- Server-side error logging
- Important audit events
- Safe API responses
- Error boundaries where appropriate

## Security

Do not expose:

- Stack traces
- SQL
- Secrets
- Internal paths
- Authentication tokens

## Testing

Force controlled failures and verify both user-facing and server-side behavior.

## Git checkpoint

```text
feat: improve production error handling
```

## Definition of Done

- Errors are handled gracefully.
- Sensitive internal details are not leaked.
- Important operational/security events can be investigated.

---

# 24. Phase 20 — SEO Implementation

## Objective

Make the storefront search-engine friendly without sacrificing performance or UX.

## Tasks

Implement:

- Page metadata
- Product metadata
- Category metadata
- Canonical URLs
- `sitemap.xml`
- `robots.txt`
- Open Graph metadata
- Twitter/social metadata where appropriate
- Product structured data
- Breadcrumb structured data where appropriate
- SEO-friendly product URLs
- Proper headings
- Image alt text
- Internal linking
- 404 handling

## Product SEO

Each indexable product should have:

- Unique title
- Useful description
- Canonical URL
- Product structured data
- Correct availability
- Correct price/currency where applicable
- Optimized image metadata

## Security

Do not expose private admin routes or customer data through sitemap/indexable metadata.

Admin pages should not be indexed.

## Testing

Verify:

- Metadata
- Canonicals
- Sitemap
- Robots
- Structured data
- Duplicate URL behavior
- No private pages in sitemap

## Git checkpoint

```text
feat: implement production SEO
```

## Definition of Done

- Public pages have appropriate metadata.
- Product pages expose useful structured data.
- Sitemap and robots behavior is correct.
- Private/admin pages are excluded.

---

# 25. Phase 21 — Performance Optimization

## Objective

Make the application fast on typical mobile connections and devices.

## Tasks

Review:

- Server/client component boundaries
- Image sizes
- Image formats
- Lazy loading
- Database queries
- Indexes
- N+1 queries
- Bundle size
- Client JavaScript
- Caching strategy
- Loading states

Avoid unnecessary client components.

## Testing

Measure:

- Page load
- Product listing
- Product detail
- Checkout
- Admin dashboard

Optimize based on measurement rather than assumptions.

## Git checkpoint

```text
perf: optimize storefront and data access
```

## Definition of Done

- No obvious N+1 queries.
- Images are appropriately optimized.
- Unnecessary client JavaScript is reduced.
- Critical pages feel responsive.

---

# 26. Phase 22 — Comprehensive Testing

## Objective

Perform the full application test pass.

## Test categories

### Unit tests

Test:

- Currency calculations
- Delivery calculations
- Validation
- Business rules
- Inventory calculations

### Integration tests

Test:

- Auth + database
- RLS
- Product operations
- Checkout
- Inventory
- Payment verification
- Email triggers

### Concurrency tests

Test:

```text
Customer A ──┐
             ├── Last available item
Customer B ──┘
```

Only the permitted number of purchases must succeed.

### End-to-end tests

Test the main journey:

```text
Homepage
→ Product
→ Cart
→ Checkout
→ Order
→ Admin
→ Verification/status
→ Customer email
```

## Git checkpoint

```text
test: complete V1 test suite
```

## Definition of Done

- Critical flows have automated coverage.
- Concurrency tests pass.
- Authorization tests pass.
- Main customer journey passes.

---

# 27. Phase 23 — Security Audit

## Objective

Perform the final security review.

This phase is a final gate, not the first security work.

## Review

Use `SECURITY_SPECIFICATION.md` as the checklist.

Review:

- Authentication
- Authorization
- RLS
- Secrets
- API routes
- Server actions
- Input validation
- Rate limiting
- File uploads
- Payment proof
- Checkout
- Inventory concurrency
- Security headers
- Error leakage
- Dependencies
- AI-generated code

## Specific tests

Attempt:

- Accessing admin while logged out
- Customer accessing admin
- Customer accessing another user's order
- Customer changing price
- Customer changing total
- Customer changing role
- Customer changing stock
- Direct API calls
- Invalid uploads
- Path traversal
- Rate-limit abuse
- Concurrent final-item checkout

## Git checkpoint

```text
security: complete V1 security audit
```

## Definition of Done

No known critical security issue remains unresolved.

High-severity findings must be resolved or explicitly accepted by the project owner before release.

---

# 28. Phase 24 — SEO and Accessibility Final Pass

## Objective

Verify public-facing quality.

## Review

Check:

- Keyboard navigation
- Form labels
- Focus states
- Semantic HTML
- Contrast
- Alt text
- Heading hierarchy
- Mobile usability
- Metadata
- Structured data
- Canonical URLs
- Sitemap
- Robots

## Git checkpoint

```text
quality: complete accessibility and SEO review
```

## Definition of Done

- No major accessibility blocker remains.
- SEO requirements are verified.
- Customer-facing pages work across expected screen sizes.

---

# 29. Phase 25 — Production Readiness Gate

## Objective

Confirm the application is ready for deployment.

Deployment/hosting selection is intentionally handled separately from this development plan.

## Checklist

### Code

- [ ] Working tree clean
- [ ] No debug code
- [ ] No temporary credentials
- [ ] No mock production data
- [ ] No unnecessary dependencies

### Build

- [ ] Install succeeds
- [ ] Lint passes
- [ ] Type checking passes
- [ ] Production build passes
- [ ] Tests pass

### Security

- [ ] Auth protected
- [ ] Admin protected
- [ ] RLS enabled
- [ ] Secrets protected
- [ ] Input validation implemented
- [ ] Rate limiting implemented
- [ ] Upload security implemented
- [ ] Checkout concurrency protected
- [ ] Security audit complete

### Database

- [ ] Migrations documented
- [ ] Constraints verified
- [ ] Indexes verified
- [ ] RLS policies verified
- [ ] Inventory model verified

### Email

- [ ] Transactional email works
- [ ] Provider credentials server-side
- [ ] Email failures handled

### SEO

- [ ] Metadata
- [ ] Canonicals
- [ ] Sitemap
- [ ] Robots
- [ ] Structured data
- [ ] Image SEO

### UX

- [ ] Mobile
- [ ] Desktop
- [ ] Checkout
- [ ] Account
- [ ] Admin
- [ ] Loading states
- [ ] Empty states
- [ ] Error states

---

# 30. Git Strategy

Use small meaningful commits.

Recommended commit categories:

```text
feat:
fix:
security:
test:
docs:
perf:
refactor:
chore:
```

Examples:

```text
feat: implement authentication
feat: add product database integration
security: protect admin routes
security: enforce order RLS
feat: implement transactional checkout
test: add checkout concurrency tests
security: validate payment proof uploads
feat: add transactional order emails
feat: implement product structured data
perf: optimize product queries
```

Avoid giant commits such as:

```text
finished everything
```

---

# 31. Git Checkpoint Rule

Before moving to the next major phase:

```powershell
git status
```

Expected:

```text
nothing to commit, working tree clean
```

Then create a focused commit.

If a phase breaks the application:

1. Stop.
2. Fix the issue.
3. Run checks.
4. Commit the working state.
5. Continue.

Do not accumulate dozens of unrelated changes without checkpoints.

---

# 32. AI-Assisted Development Rules

The project may use Antigravity and other AI coding tools.

AI should be treated as an implementation assistant, not as the security authority.

For every AI-generated change:

1. Understand what files changed.
2. Review the diff.
3. Check whether the change touches security-sensitive code.
4. Run tests.
5. Run lint/type checks.
6. Check for secret exposure.
7. Check authorization.
8. Check database/RLS implications.
9. Commit only after review.

Never tell an AI coding tool to "make everything secure" and assume the result is sufficient.

For security-sensitive tasks, give the AI the relevant specification document and explicit constraints.

---

# 33. Recommended Antigravity Workflow

For each task:

### Step 1 — Read specifications

Give the agent the relevant documents:

```text
docs/PRD.md
docs/TECHNICAL_ARCHITECTURE.md
docs/DATABASE_SPECIFICATION.md
docs/SECURITY_SPECIFICATION.md
docs/DEVELOPMENT_PLAN.md
```

### Step 2 — Give one task

Example:

```text
Implement Phase 3: RLS and authorization foundation.

Read the project specifications first.
Do not modify unrelated frontend UI.
Do not weaken security to make tests pass.
Show me the files you intend to change before making the changes.
```

### Step 3 — Review changes

Inspect:

```powershell
git status
git diff
```

### Step 4 — Run checks

Run the relevant tests/build/lint commands.

### Step 5 — Security review

For security-sensitive changes, manually inspect the implementation.

### Step 6 — Commit

Only after verification.

---

# 34. Definition of Done — Universal Rule

A feature is **Done** only when all applicable conditions are true:

```text
Implementation complete
        +
Server-side validation complete
        +
Authorization complete
        +
Database/RLS complete
        +
Tests complete
        +
Security review complete
        +
UX verified
        +
Lint/type/build checks pass
        +
Git checkpoint created
```

A feature is not Done merely because the UI looks correct.

---

# 35. V1 Scope Control

Do not add features that are outside V1 without an explicit decision.

Examples of features that should not silently enter V1:

- Complex loyalty programs
- Advanced analytics
- Multi-vendor marketplace
- Automated gateway integrations not included in the PRD
- Complex promotions
- AI product recommendations
- Advanced warehouse management
- Multi-store architecture

If a new feature is requested:

```text
Request
  ↓
Check PRD
  ↓
Check architecture
  ↓
Assess database/security impact
  ↓
Decide whether V1 or post-V1
  ↓
Update documentation if accepted
```

---

# 36. Final Implementation Order

The practical order is:

```text
0. Baseline verification
        ↓
1. Environment + Supabase
        ↓
2. Database schema
        ↓
3. RLS + authorization
        ↓
4. Authentication
        ↓
5. Protected admin
        ↓
6. Products/categories
        ↓
7. Media uploads
        ↓
8. Cart
        ↓
9. Delivery rules
        ↓
10. Checkout + orders + concurrency
        ↓
11. Inventory
        ↓
12. Order management
        ↓
13. Payment verification
        ↓
14. Transactional email
        ↓
15. Customer account/history
        ↓
16. Storefront UX completion
        ↓
17. Admin UX completion
        ↓
18. Rate limiting
        ↓
19. Error handling/observability
        ↓
20. SEO
        ↓
21. Performance
        ↓
22. Comprehensive testing
        ↓
23. Security audit
        ↓
24. Accessibility + SEO final pass
        ↓
25. Production readiness gate
        ↓
Deployment planning (separate)
```

---

# 37. Critical Dependencies

Some phases must not be implemented independently.

| Feature | Depends On |
|---|---|
| Product database | Database + RLS |
| Admin product management | Auth + roles + RLS |
| Checkout | Products + inventory + delivery rules |
| Inventory | Database + checkout transaction model |
| Payment verification | Orders + storage + authorization |
| Transactional email | Orders + server-side secrets |
| Customer order history | Auth + orders + RLS |
| Rate limiting | Sensitive endpoints identified |
| SEO | Stable public routes/data |
| Performance | Real database queries |
| Final security audit | All security-sensitive features |

---

# 38. Current Next Action

After committing this document, do not begin all phases at once.

The next implementation task should be:

**Phase 0 — Repository and Baseline Verification**

First inspect the current application and run the existing checks.

Do not modify application behavior until the baseline is understood.

Recommended commands:

```powershell
git status
pnpm install
pnpm lint
pnpm build
```

Then inspect any errors before making changes.

The project should move forward one verified phase at a time.
