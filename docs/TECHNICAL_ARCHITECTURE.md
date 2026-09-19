# Mobile Store E-Commerce Platform
# Technical Architecture Specification

**Version:** V1.0
**Status:** Development Specification
**Target:** Production
**Market:** Nepal

---

# 1. Architecture Goals

The system must be:

- Secure
- Maintainable
- Simple for the store owner
- Suitable for a small initial customer volume
- Cost-conscious
- SEO-friendly
- Mobile-friendly
- Able to handle concurrent orders safely
- Easy for future developers to understand
- Extensible without requiring a rewrite

The architecture must support future:

- POS
- eSewa
- Khalti
- Other payment gateways
- Delivery partner APIs
- WhatsApp/SMS notifications
- Additional staff roles
- More advanced analytics

without coupling V1 tightly to those systems.

---

# 2. High-Level Architecture

The system will use:

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- Resend for transactional email
- Server-side validation
- Rate limiting

High-level flow:

Customer Browser
        |
        v
Next.js Application
        |
        +----------------------+
        |                      |
        v                      v
Server-side Logic          Supabase Auth
        |                      |
        +----------+-----------+
                   |
                   v
             PostgreSQL
                   |
          +--------+--------+
          |        |        |
        Orders  Inventory  Customers
          |
        Payments
          |
        Email Events
          |
        Resend

Media:

Admin
  |
  v
Next.js Server
  |
  v
Supabase Storage
  |
  v
Optimized media served to customers

---

# 3. Frontend Architecture

## Framework

Use:

- Next.js
- App Router
- React
- TypeScript
- Tailwind CSS
- Existing shadcn/Base UI components where appropriate

The existing v0 frontend is the visual foundation.

Do not unnecessarily redesign the existing storefront.

The existing UI should be progressively connected to real backend
functionality.

---

# 4. Next.js Responsibilities

Next.js is responsible for:

- Rendering storefront pages
- SEO metadata
- Product pages
- Category pages
- Search UI
- Cart UI
- Checkout UI
- Account UI
- Admin UI
- Server-side application logic
- Server Actions where appropriate
- Route handlers where appropriate
- Secure communication with Supabase
- Secure communication with Resend
- Input validation
- Authorization checks
- Rate limiting
- Error handling

The browser must not directly perform privileged operations.

---

# 5. Browser vs Server Boundary

The browser is considered untrusted.

The browser may:

- Display products
- Display prices
- Maintain temporary cart state
- Submit forms
- Upload permitted files through controlled mechanisms
- Request permitted data

The browser must NOT be trusted for:

- Price
- Stock
- Discount
- Coupon validity
- Payment status
- User identity
- Admin privileges
- Order ownership
- Inventory quantities

All critical values must be validated server-side.

---

# 6. Supabase Responsibilities

Supabase will provide:

- PostgreSQL database
- Authentication
- Google OAuth
- Storage
- Row Level Security
- Database transactions
- Database functions where appropriate

Supabase should remain the system of record for:

- Users
- Products
- Categories
- Brands
- Orders
- Order items
- Payments
- Inventory
- Coupons
- Banners
- Customers
- Staff roles
- Audit records

---

# 7. Authentication Architecture

Supabase Auth will manage authentication.

Primary customer authentication:

Google OAuth.

Customers may continue using guest checkout without authentication.

Authentication flow:

Customer
   |
   v
Google Sign-In
   |
   v
Supabase Auth
   |
   v
Authenticated session
   |
   v
Next.js
   |
   v
Database/RLS

The application must never trust a user ID supplied manually by
the browser.

The authenticated identity must come from the verified session.

---

# 8. Guest Checkout

Guest checkout is mandatory for V1.

A customer does not need a Google account to purchase.

Guest checkout collects:

- Name
- Phone
- Email where available
- Province
- District
- Municipality/City
- Area
- Address
- Delivery notes

Guest orders must still have a unique order identifier.

Guest customers should receive transactional emails when an email
address is available.

---

# 9. Customer Accounts

Authenticated customers can:

- View their profile
- View their order history
- View order details
- Access orders associated with their account

Customer data access must be enforced through authorization and
RLS.

A customer must never be able to access another customer's orders
by changing an ID in a URL or request.

---

# 10. Authorization Architecture

Authentication answers:

"Who is this user?"

Authorization answers:

"What is this user allowed to do?"

These must be treated separately.

Roles:

- owner
- staff
- customer

The role must never be determined from client-side state.

Admin authorization must be enforced using:

1. Server-side authorization
2. Database RLS
3. Role data stored in the database

Hiding an admin link is NOT considered security.

---

# 11. Admin Route Protection

Admin routes will eventually use a protected structure such as:

/admin
/admin/products
/admin/orders
/admin/inventory
/admin/customers
/admin/payments
/admin/coupons
/admin/banners
/admin/analytics
/admin/settings

Unauthenticated users must not access protected admin functionality.

Authenticated customers must also not automatically receive admin
access.

Admin authorization must be checked server-side.

Middleware may be used for early route protection, but middleware
must NOT be the only security layer.

---

# 12. Database Architecture

PostgreSQL is the primary database.

The database is the source of truth.

The database must enforce:

- Primary keys
- Foreign keys
- Unique constraints
- Check constraints
- Not-null constraints where appropriate
- Indexes
- RLS policies

Business-critical validation must not exist only in the frontend.

---

# 13. Core Data Domains

The database will be organized conceptually around:

## Identity

- profiles
- roles/staff permissions

## Catalogue

- products
- categories
- brands
- product media

## Commerce

- carts if required
- orders
- order items
- coupons
- coupon usage

## Payments

- payment records
- payment proofs
- payment verification records

## Inventory

- inventory records
- inventory transactions

## Content

- banners
- promotional content

## Audit

- important administrative actions
- important state transitions

The exact table definitions belong in the Database Specification,
not this document.

---

# 14. Product Architecture

Products should have stable database IDs.

Products should also have:

- SEO-friendly slug
- Name
- Brand
- Category
- Description
- Price
- Compare-at price where applicable
- Active/archived state
- Stock information
- Metadata/specifications

The browser must not be able to change product prices.

---

# 15. Order Architecture

An order represents the customer's purchase request.

Orders should contain:

- Unique order ID
- Customer reference where authenticated
- Guest customer information where applicable
- Delivery information
- Payment method
- Payment status
- Order status
- Pricing snapshot
- Coupon information where applicable
- Delivery charge
- Final total
- Timestamps

Order items must store the relevant purchase-time values.

Historical orders must not change when the current product price
changes.

Therefore order items must preserve the price used when the order
was created.

---

# 16. Pricing Architecture

Final order pricing must be calculated server-side.

The server must independently calculate:

- Product subtotal
- Discounts
- Coupon discount
- Delivery charge
- Final total

The client may display estimated totals, but those values must not
be trusted.

The server must re-fetch product data and validate all quantities
during checkout.

---

# 17. Coupon Architecture

Coupon validation happens server-side.

The server must validate:

- Coupon existence
- Active status
- Expiry
- Usage limits
- Minimum order value
- Applicable products/categories where required
- Discount calculation

The client cannot decide the final discount.

---

# 18. Inventory Architecture

Inventory will use an append-only transaction model.

The system must maintain an auditable history rather than relying
only on a mutable stock number.

Inventory transaction examples:

- initial_stock
- stock_received
- stock_adjustment
- order_reserved
- order_confirmed
- order_cancelled
- stock_returned
- damaged
- future_pos_sale

Inventory transactions should record:

- Product
- Quantity change
- Transaction type
- Reference
- Actor
- Timestamp
- Optional reason

The exact schema is defined in the Database Specification.

---

# 19. Inventory Source of Truth

The system should derive reliable stock state from inventory data.

Where a current stock field/cache is maintained for performance,
it must remain consistent with the transaction ledger.

Direct arbitrary browser-side stock updates are forbidden.

---

# 20. Checkout Concurrency

Overselling prevention is a critical requirement.

When two or more customers attempt to purchase limited stock
simultaneously, the database must serialize the critical inventory
operation.

Checkout must use a PostgreSQL transaction.

Where appropriate, the implementation must use row-level locking,
for example:

SELECT ... FOR UPDATE

The transaction must:

1. Begin transaction
2. Lock relevant product/inventory row(s)
3. Re-read current stock
4. Validate requested quantity
5. Validate current price
6. Validate coupon
7. Calculate final amount
8. Create order
9. Create order items
10. Create inventory transaction/reservation
11. Commit transaction

If any required validation fails:

- The transaction must roll back
- No partial order must remain
- No incorrect inventory deduction must remain

Concurrency tests must be written at the same time as checkout
implementation.

---

# 21. Payment Architecture

V1 supports:

## COD

Payment status begins as:

pending_cod

The order can proceed according to the store's COD workflow.

## Manual Online Payment

The store will provide configured QR/payment information.

Customer:

1. Selects online payment
2. Sees payment instructions/QR
3. Pays externally
4. Uploads payment screenshot
5. Submits order
6. Order enters payment verification state
7. Admin reviews proof
8. Admin verifies or rejects payment

The screenshot is evidence for manual review.

Uploading a screenshot must NOT automatically mark payment as
successful.

---

# 22. Future Payment Gateway Compatibility

The payment architecture must not hard-code the application around
manual QR payments.

Payment methods should be represented as data/configuration.

Future methods can include:

- esewa
- khalti
- other gateway integrations

A future gateway should be able to:

1. Create payment request
2. Redirect/initiate payment
3. Receive callback/webhook
4. Verify payment
5. Update payment status
6. Update order state

without rewriting the core order model.

---

# 23. Payment Proof Storage

Payment screenshots are sensitive business data.

They must not be placed in a public storage bucket.

Access should be controlled.

Only authorized staff/owner users should be able to view payment
proofs.

The system should validate:

- File type
- File size
- File extension
- MIME type where possible

Uploaded files must have generated storage names rather than
trusting user-provided filenames.

---

# 24. Media Architecture

Supabase Storage will be used for managed store media unless the
final hosting/media architecture requires another compatible
solution.

Media categories may include:

- Product images
- Product videos
- Banner images
- Payment proofs

Public storefront media and private payment proofs must use
different access policies.

Product/banner media may be publicly readable.

Payment proofs must be private.

---

# 25. Image Processing

The application must not rely on Cloudflare Workers-compatible
Sharp processing.

Sharp must NOT be assumed to run inside the Cloudflare Workers
runtime.

Image optimization must therefore happen in a Node-capable
environment or through a compatible image/media service.

The exact production hosting decision is intentionally deferred.

The architecture must keep image processing separate from the
Cloudflare Workers runtime.

---

# 26. File Upload Security

Uploads must be treated as untrusted input.

Requirements:

- Validate MIME type
- Validate file extension
- Validate file size
- Generate safe filenames
- Avoid executable file types
- Restrict upload destinations
- Use private buckets for sensitive files
- Do not trust client-provided metadata
- Apply access control
- Avoid rendering uploaded HTML/SVG as executable content unless
  explicitly sanitized and required

---

# 27. Email Architecture

Resend will be used for transactional email.

Email sending will happen only from trusted server-side code.

The Resend API key must:

- Exist only in server-side environment variables
- Never be included in client bundles
- Never be committed to Git
- Never be returned to the browser

Email events may include:

- Order placed
- Payment verified
- Payment rejected
- Order confirmed
- Order shipped
- Order delivered/cancelled where appropriate

Email sending should be decoupled from the core database transaction
where necessary so that an email provider failure does not corrupt
the order.

---

# 28. Email Failure Handling

An order must not be considered failed merely because an email
could not be sent.

The system should:

1. Successfully commit the order
2. Record the relevant email event
3. Attempt email delivery
4. Record success/failure
5. Allow retry where appropriate

---

# 29. Rate Limiting

Rate limiting is required for public and sensitive endpoints.

Especially:

- Authentication-related operations
- Login attempts
- Checkout
- Coupon validation
- Payment proof uploads
- Contact forms if added
- Admin-sensitive operations
- Email-triggering operations

The implementation must use a rate-limiting mechanism compatible
with the final deployment environment.

Rate limits must not depend solely on client-side code.

---

# 30. Input Validation

All external input must be validated.

This includes:

- Checkout data
- Phone number
- Email
- Address
- Product IDs
- Quantities
- Coupon codes
- Search/filter parameters
- Admin forms
- Upload metadata
- Order status updates

Validation should happen at the server boundary.

A schema-validation library may be used where appropriate.

---

# 31. API / Server Action Architecture

Where Server Actions are used:

- Validate all inputs
- Authenticate where required
- Authorize the operation
- Perform database operation
- Return only required data
- Avoid leaking sensitive information

Where Route Handlers are used:

- Validate request
- Authenticate
- Authorize
- Apply rate limiting
- Perform operation
- Return controlled responses

No privileged database credentials may be exposed to the browser.

---

# 32. Supabase Client Separation

The application should distinguish between:

## Browser Supabase Client

Used for permitted client-side authentication/session operations.

## Server Supabase Client

Used for authenticated server-side operations.

## Service-role credentials

If ever required, they must exist ONLY in trusted server-side
code.

The Supabase service-role key must never be exposed to:

- Browser JavaScript
- NEXT_PUBLIC_* variables
- Client components
- Public API responses

---

# 33. Row Level Security

RLS is mandatory.

Examples:

Customer:

- Can read their own profile
- Can read their own orders
- Can read their own order items
- Cannot read another customer's orders

Staff/Owner:

- Can access resources according to role

Public:

- Can read only explicitly public catalogue/content data

Sensitive resources:

- Payment proofs
- Administrative data
- Internal audit information

must not be publicly readable.

RLS policies must be tested.

---

# 34. Admin Security

Admin operations must require:

- Valid authenticated session
- Correct role
- Server-side authorization
- Appropriate RLS permissions

Admin UI visibility is not a security mechanism.

A user must not gain privileges by:

- Editing JavaScript
- Changing localStorage
- Modifying request payloads
- Changing a URL
- Calling an API directly

---

# 35. Security Headers

The production application should implement appropriate security
headers, including where applicable:

- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Frame protections

The exact CSP must be compatible with:

- Google OAuth
- Supabase
- Resend-related workflows
- Required image/media sources

Headers must be tested before production deployment.

---

# 36. Existing Security Findings

The current v0 audit identified:

## Public Admin Link

The admin link is currently visible without access control.

This is not considered sufficient security.

The final implementation must protect admin functionality through
authentication, authorization and RLS.

## Missing Middleware

There is currently no middleware protection.

Middleware may be introduced when authentication and protected
routes are implemented.

Middleware must not be the sole authorization mechanism.

## TypeScript Build Errors

The current project uses:

typescript.ignoreBuildErrors = true

This must be removed before production.

Production builds must fail on TypeScript errors.

## v0 Generator Metadata

The production application must remove:

generator: "v0.app"

from public metadata.

## Placeholder metadataBase

The current placeholder metadataBase must be replaced with the
actual production domain before launch.

---

# 37. SEO Architecture

SEO is implemented primarily through Next.js server-rendered
metadata and structured data.

The architecture must support:

- Page-specific metadata
- Product metadata
- Category metadata
- Canonicals
- Sitemap
- robots.txt
- Product JSON-LD
- Organization JSON-LD
- Breadcrumb structured data
- Open Graph
- Social metadata

Product and category pages should remain crawlable.

---

# 38. Performance Architecture

Prefer server rendering for content that does not require client
interactivity.

Client Components should only be used when required.

Examples:

Server-oriented:

- Product pages
- Category pages
- SEO metadata
- Product catalogue retrieval

Client-oriented:

- Cart interactions
- Quantity controls
- Interactive filters where required
- Checkout form interactions
- Admin interactive components

Avoid unnecessary client-side JavaScript.

---

# 39. Caching and Revalidation

Catalogue/content data may be cached where appropriate.

Highly dynamic data must not be served from stale caches when it
could affect:

- Stock
- Price
- Checkout
- Payment status
- Order status

Inventory and checkout must always use authoritative current data.

---

# 40. Future POS Compatibility

The inventory model must not assume that every sale comes from the
website.

Future sources may include:

- online_order
- pos_sale
- manual_adjustment
- return
- damaged

A future POS should be able to create inventory transactions
against the same inventory system.

This avoids maintaining separate stock systems.

---

# 41. Future Delivery Integration

V1 delivery is manual.

The order architecture should preserve fields needed later for:

- Delivery partner
- Delivery provider order ID
- Tracking ID
- Delivery status
- Pickup status
- Delivery fee
- Delivery metadata

Pathao or another provider can later be integrated through a
separate service/integration layer.

---

# 42. Future Notification Integration

Notification channels should not be hard-coded into order logic.

Future channels may include:

- Email
- WhatsApp
- SMS

The order state transition should generate an internal event, and
notification providers can react to those events.

---

# 43. Error Handling

Errors returned to customers must not expose:

- Database errors
- SQL details
- Internal stack traces
- API keys
- Service credentials
- Internal infrastructure details

Detailed errors should be logged securely on the server.

Customer-facing messages should be safe and understandable.

---

# 44. Logging and Auditing

The system should record important administrative actions.

Examples:

- Product price changes
- Stock adjustments
- Payment verification
- Order status changes
- Coupon changes
- Banner changes
- Staff/role changes

Logs must not contain sensitive credentials.

---

# 45. Environment Variables

Environment variables must be separated by environment.

Examples of server-only secrets:

- Supabase service-role key
- Resend API key
- Rate-limit credentials where applicable
- Other private provider credentials

Only explicitly safe public configuration may use
NEXT_PUBLIC_* variables.

Secrets must never be committed to Git.

The existing .gitignore already excludes local environment files
and must continue to do so.

---

# 46. Development Environments

At minimum, use separate:

- Local development
- Staging
- Production

Supabase should have a separate staging project.

Production data must not be used casually during development.

Migrations must be tested against staging before production.

---

# 47. Database Migrations

Database schema changes must be tracked as migrations.

Developers must not rely on manually changing production tables.

Workflow:

Development
   |
   v
Migration
   |
   v
Staging
   |
   v
Testing
   |
   v
Production

---

# 48. Testing Architecture

Testing must cover:

## Unit Tests

- Pricing
- Coupon calculation
- Validation
- Inventory calculations

## Integration Tests

- Authentication
- Orders
- Payments
- Inventory
- RLS

## Concurrency Tests

Specifically test:

- Two customers purchasing the last item
- Multiple simultaneous checkout attempts
- Cancellation/restoration

## Security Tests

- Unauthorized admin access
- IDOR attempts
- Invalid inputs
- Rate-limit behavior
- File upload abuse
- Privilege escalation attempts

## SEO Tests

- Metadata
- Canonicals
- Sitemap
- robots.txt
- Structured data

Testing begins alongside implementation.

Final security/performance testing is a release gate, not the first
time these areas are tested.

---

# 49. Backup and Recovery

The final production deployment must have a documented:

- Backup policy
- Retention policy
- Recovery procedure
- Database restoration procedure

The exact backup capability depends on the selected Supabase plan
and final infrastructure.

This must be finalized before production deployment.

---

# 50. Architecture Decision Summary

V1 architecture:

Frontend:
Next.js + TypeScript + Tailwind + existing UI

Backend/Application:
Next.js server-side logic

Database:
Supabase PostgreSQL

Authentication:
Supabase Auth + Google OAuth

Authorization:
Server-side authorization + PostgreSQL RLS

Storage:
Supabase Storage

Email:
Resend

Inventory:
Append-only transaction model

Concurrency:
PostgreSQL transactions + row-level locking

Payments:
COD + manual QR payment verification

SEO:
Next.js metadata + structured data + sitemap + robots

Security:
RLS + validation + rate limiting + secure server-side secrets

Future:
POS + payment gateways + delivery integrations + WhatsApp/SMS

---

# 51. Explicit Architecture Constraints

The implementation must NOT:

- Put secrets in client code
- Expose Supabase service-role credentials
- Trust client-side prices
- Trust client-side stock
- Trust client-side roles
- Allow public access to payment proofs
- Use screenshots as automatic payment verification
- Allow direct browser manipulation of inventory
- Ignore TypeScript errors in production
- Depend only on middleware for authorization
- Depend only on frontend checks for security
- Couple V1 directly to a single future payment gateway
- Couple inventory exclusively to online orders

---

# 52. Implementation Principle

Build the system incrementally.

Do not replace the working storefront unnecessarily.

Recommended progression:

1. Architecture
2. Database specification
3. Security specification
4. Supabase project setup
5. Authentication
6. Real catalogue
7. Admin product management
8. Inventory
9. Cart/checkout backend
10. Order processing
11. Manual payment verification
12. Email
13. Coupons
14. Banner/content management
15. Analytics
16. SEO
17. Security testing
18. Performance testing
19. Final production readiness

Each major stage must have:

- Tests
- Git checkpoint
- Review
- No known critical security issue

---

# 53. Definition of Architectural Completion

The architecture phase is complete when:

- All V1 systems have defined boundaries
- Database responsibilities are clear
- Authentication responsibilities are clear
- Authorization responsibilities are clear
- RLS is planned
- Inventory concurrency is defined
- Payment flow is defined
- Email flow is defined
- Media security is defined
- Future integrations have extension points
- Security boundaries are documented
- Staging/production separation is documented
- No major architectural decision remains ambiguous