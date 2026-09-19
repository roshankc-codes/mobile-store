# Mobile Store E-Commerce Platform
## Security Specification

**Version:** V1.0  
**Status:** Development Specification  
**Target Market:** Nepal  
**Security Priority:** Critical  
**Applies To:** Customer storefront, admin/staff dashboard, Next.js server/backend, Supabase Auth, PostgreSQL, Supabase Storage, transactional email

---

# 1. Purpose

This document defines the security requirements for the V1 Mobile Store E-Commerce Platform.

The application is a production-oriented e-commerce system, not a prototype. Security controls must therefore be implemented at the server/database level and must not depend only on frontend UI restrictions.

Primary goals:

- Protect customer accounts and personal information.
- Protect administrative functionality.
- Prevent unauthorized access to orders, payment records, inventory, and products.
- Prevent price and total manipulation.
- Prevent inventory overselling during concurrent checkout.
- Protect uploaded files and payment proof.
- Prevent API abuse.
- Protect application secrets.
- Reduce exposure to common web vulnerabilities.
- Maintain auditable records of important administrative operations.
- Ensure AI-generated code receives security review before sensitive functionality is accepted.

---

# 2. Security Principles

## 2.1 Never trust the client

The browser is an untrusted environment.

Never trust frontend values for:

- Product price
- Product availability
- Inventory quantity
- Order total
- Delivery fee
- Discount
- User role
- Payment verification state
- Order status
- Ownership
- File type or size
- Authorization

The server/database must independently validate and calculate security-sensitive values.

## 2.2 Frontend visibility is not authorization

Hiding a button, menu item, or page does not protect the underlying operation.

Every protected route, API endpoint, server action, database operation, and storage operation must enforce authorization independently.

## 2.3 Default deny

Access should be denied unless explicitly granted.

This applies especially to:

- Admin functionality
- Staff functionality
- Customer data
- Payment proof
- Inventory
- Database tables
- Private storage

## 2.4 Least privilege

Users, server components, service accounts, API keys, and database operations receive only the permissions they require.

## 2.5 Defense in depth

Security should exist at multiple layers:

```text
Browser
   ↓
Next.js route/server validation
   ↓
Authentication
   ↓
Authorization
   ↓
Supabase RLS
   ↓
PostgreSQL constraints/transactions
   ↓
Storage policies
```

No single layer is the only security boundary.

---

# 3. Security Architecture

The major security boundaries are:

```text
Customer / Admin Browser
          |
          v
     Next.js App
          |
    Authentication
          |
    Authorization
          |
          +-----------> Resend (server-side only)
          |
          v
      Supabase
       /           v       v
 PostgreSQL  Storage
   + RLS
```

## 3.1 Browser

The browser must never contain:

- Supabase service-role credentials
- Database passwords
- Resend API keys
- Private application secrets
- Server-only credentials

Client-side validation is for user experience and is never sufficient for security.

## 3.2 Next.js server/backend

The server is responsible for:

- Authentication checks
- Authorization checks
- Runtime input validation
- Business rules
- Server-side price calculation
- Order creation
- Inventory operations
- Payment verification operations
- Secure email sending
- Sensitive database operations

## 3.3 PostgreSQL and RLS

PostgreSQL constraints, transactions, and Supabase Row Level Security provide database-level protection.

RLS must remain enabled on protected tables.

## 3.4 Supabase Storage

Storage access must be protected with appropriate bucket policies.

Private customer/payment files must not be public unless explicitly required.

---

# 4. Authentication

Authentication must follow the authentication architecture defined in the Technical Architecture document.

Authentication establishes identity; it does not automatically grant authorization.

## 4.1 Customer authentication

Customers may access customer functionality permitted by the V1 PRD.

Customer identity must be verified before accessing protected personal resources.

## 4.2 Admin/staff authentication

Administrative functionality requires an authenticated administrative user.

The application must not rely on the existence of an `/admin` URL alone.

## 4.3 Session security

Where cookies are used, appropriate security properties must be applied, including where applicable:

- `Secure`
- `HttpOnly`
- `SameSite`
- Appropriate expiration

Sensitive authentication information must not be stored in insecure client-side storage.

## 4.4 Logout

Logout must invalidate the applicable session. An invalidated session must not retain access to protected resources.

---

# 5. Authorization and Roles

Where V1 uses `owner`, `staff`, and `customer`, permissions must follow the responsibilities defined by the PRD and database specification.

## 5.1 Customer permissions

Customers may:

- Browse products
- Search products
- Add products to a cart
- Create orders
- View their own orders
- View their own account information

Customers must not:

- Modify product prices
- Modify product stock
- Modify inventory transactions
- Verify payments
- Change order ownership
- Change their role
- Access another customer's order
- Access administrative records

## 5.2 Staff permissions

Staff permissions must be limited to the operations defined by the database and PRD.

Staff must not automatically receive owner-level permissions.

## 5.3 Owner permissions

Owner-level operations may include:

- Product management
- Inventory management
- Order management
- Payment verification
- Administrative configuration
- Other privileged operations explicitly defined by V1

Exact permissions must follow the database specification.

## 5.4 Privilege escalation prevention

A user must never become an administrator or staff member by modifying:

- Request bodies
- Cookies
- Local storage
- Query parameters
- URL parameters
- Frontend JavaScript
- Hidden form fields
- Browser developer tools

Role changes must be performed through an authorized server-side/admin workflow and protected by database authorization.

---

# 6. Admin Route Security

The initial frontend security audit identified a publicly visible admin link with no corresponding access control.

This must be corrected.

Requirements:

- Admin navigation visibility is not a security control.
- Direct navigation to admin URLs must be protected.
- Admin server actions/API routes must be protected.
- The authenticated user's role must be checked.
- Unauthorized users must receive an appropriate denial response.
- Customers must not gain access by manually entering admin URLs.
- Admin endpoints must not rely solely on middleware.

If `middleware.ts` is used, it provides an early route-level protection layer. It must not replace server authorization or database RLS.

---

# 7. Supabase Row Level Security

RLS is mandatory for protected database tables.

Default model:

```text
No policy
    ↓
No access
```

Policies should explicitly grant the minimum required operation.

## 7.1 Customer data

Customers may only access their own protected data.

A customer must not:

- Read another customer's order
- Modify another customer's order
- Read another customer's personal information
- Read private payment proof belonging to another customer

## 7.2 Products

Public product reads may be permitted according to storefront requirements.

Administrative product mutations require appropriate authorization.

Customers must never directly change:

- Product price
- Stock
- Administrative fields

## 7.3 Orders

Customers may read their own orders.

Order creation must follow the server-side checkout workflow.

Customers must not directly update:

- Payment verification status
- Administrative order status
- Internal notes
- Refund status
- Inventory state

## 7.4 Inventory

Customers have no permission to modify inventory transactions.

Inventory changes originate from authorized server-side workflows.

## 7.5 Payment records

Only authorized administrative users may perform payment verification operations.

Customer access is limited to information required by the customer-facing experience.

## 7.6 Storage policies

Storage policies must enforce ownership and role-based access.

A private file must not become accessible simply because a user guesses its URL.

---

# 8. API and Server Action Security

Every API route or server action accepting external input follows:

```text
1. Authenticate
2. Authorize
3. Validate input
4. Apply business rules
5. Perform database operation
6. Return safe response
7. Log important security events where appropriate
```

Never trust:

- Request body
- Query parameters
- URL parameters
- Hidden fields
- Client-side calculations
- Client-provided prices
- Client-provided totals
- Client-provided roles
- Client-provided inventory values

The server must calculate or retrieve:

- Product price
- Product availability
- Subtotal
- Delivery charge
- Discounts
- Final total
- Order state
- Inventory state

---

# 9. Input Validation

All external input must be validated at runtime.

TypeScript types alone do not provide runtime validation.

Validate:

- Name
- Phone number
- Email
- Address
- Product IDs
- Quantities
- Search values
- Pagination parameters
- Order IDs
- Payment references
- Uploaded file metadata
- Administrative form data

Reject:

- Missing required fields
- Invalid formats
- Invalid IDs
- Negative quantities
- Zero quantities where not allowed
- Excessively large values
- Malformed input
- Oversized input

The validation approach must remain consistent with the Technical Architecture document.

---

# 10. Rate Limiting and Abuse Protection

Rate limiting is required for security-sensitive operations.

At minimum, consider protection for:

- Authentication
- Password/account recovery
- Admin authentication
- Checkout
- Order creation
- Payment proof upload
- Email-triggering operations
- Search/API-heavy endpoints
- Administrative APIs

Rate limits should be configurable rather than scattered throughout the application.

The implementation must account for the actual production deployment architecture.

An in-memory limiter must not be assumed to provide reliable distributed protection when the application runs across multiple instances.

If the final distributed rate-limiting mechanism has not been selected:

**DECISION REQUIRED**

Rate-limit failures should return an appropriate response such as `429 Too Many Requests`.

---

# 11. Checkout Security

Checkout is security-critical.

The browser cart is untrusted input.

## 11.1 Server-side recalculation

The server must retrieve authoritative product information and calculate:

```text
Unit Price × Quantity = Line Total

Line Totals + Delivery - Valid Discounts = Final Total
```

The client-provided total must never be trusted.

## 11.2 Inventory validation

Stock availability must be checked on the server.

## 11.3 Transactional checkout

Order creation and inventory modification must be performed in a transactionally safe workflow.

## 11.4 Row-level locking

The project must explicitly protect concurrent purchases of the final available item.

Where required, PostgreSQL row-level locking such as:

```sql
SELECT ...
FROM ...
WHERE ...
FOR UPDATE;
```

must be used inside the checkout transaction.

The goal is to prevent two concurrent customers from successfully purchasing the final available unit.

## 11.5 Concurrency tests

Concurrency tests must be written alongside checkout/inventory implementation.

At minimum test:

- Two customers buying the final unit
- Multiple simultaneous checkout attempts
- Duplicate checkout submission
- Out-of-stock checkout
- Invalid quantity
- Manipulated price
- Manipulated total

---

# 12. Inventory Security

V1 uses the append-only inventory transaction model defined in the database specification.

Requirements:

- Customers cannot create inventory transactions.
- Customers cannot modify inventory.
- Unauthorized staff cannot modify protected inventory operations.
- Inventory changes must be attributable to an authorized operation/user where applicable.
- Negative inventory must be prevented unless explicitly supported.
- Concurrent checkout must be transactionally safe.
- Inventory history must remain auditable.

---

# 13. Price and Order Integrity

The client must never determine the authoritative price.

The backend must retrieve the current authoritative product price.

The same applies to:

- Subtotal
- Discount
- Delivery charge
- Final total

Historical order pricing must be stored with the order/order-item record so later product price changes do not silently change an existing order.

Customers must not directly change:

- Order total
- Payment verification status
- Administrative status
- Refund status
- Internal notes

---

# 14. Payment / QR Proof Security

If manual QR payment proof is part of V1, payment-proof uploads are security-sensitive.

Requirements:

- Accept only required file types.
- Validate MIME type.
- Validate file signature/magic bytes where practical.
- Enforce maximum file size.
- Generate safe storage names.
- Never trust original filenames as storage paths.
- Prevent path traversal.
- Store private payment proof in protected storage.
- Restrict access to authorized users.
- Restrict payment verification to authorized administrative users.
- Record payment verification events.
- Prevent unauthorized replacement or alteration of verified proof.

Payment credentials, passwords, PINs, and other sensitive banking credentials must never be requested or stored by the application.

---

# 15. File Upload Security

Product images and customer/payment uploads must be treated separately where access requirements differ.

## 15.1 File validation

Validate:

- Extension
- MIME type
- Actual file signature where practical
- File size
- Image dimensions where applicable

Do not trust only the filename extension.

## 15.2 Safe filenames

Never use an untrusted filename directly as a filesystem/storage path.

Generate server-controlled unique storage names.

## 15.3 Path traversal

Reject or neutralize attempts involving paths such as:

```text
../../secret
```

or equivalent encoded forms.

## 15.4 Image processing

Image processing must occur in a runtime that supports the selected image-processing implementation.

The architecture must not execute native `Sharp` processing inside a Cloudflare Workers runtime.

If Sharp is used, it must run in a Node-capable environment.

## 15.5 Image resource protection

Limit:

- File size
- Pixel dimensions
- Processing workload

This reduces resource exhaustion risks from extremely large or malicious images.

---

# 16. Cross-Site Scripting (XSS)

Protect against:

- Stored XSS
- Reflected XSS
- DOM-based XSS

Preserve React's default escaping.

Avoid:

```tsx
dangerouslySetInnerHTML
```

unless explicitly required and the content has been safely sanitized.

User-generated rich text must not be rendered as HTML without appropriate sanitization.

---

# 17. SQL Injection and Database Security

Never construct SQL using unsafe string concatenation with user input.

Use:

- Supabase query APIs
- Parameterized queries
- Safe database functions
- Validated filters

Never allow users to submit arbitrary SQL.

Database security combines:

```text
Parameterized queries
+
Input validation
+
RLS
+
Database constraints
+
Least privilege
```

---

# 18. CSRF and Request Security

State-changing operations require appropriate request/session protections.

Relevant operations include:

- Login
- Account changes
- Checkout
- Order creation
- Payment verification
- Product management
- Inventory management
- Admin operations

Follow the protections provided by the chosen authentication/session architecture.

If an additional CSRF mechanism is required:

**DECISION REQUIRED**

Do not introduce a mechanism that conflicts with the authentication architecture.

---

# 19. Security Headers

The production application should evaluate and configure appropriate security headers, including where compatible:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `frame-ancestors` / clickjacking protection

CSP must be tested carefully with Next.js, authentication, image sources, and third-party resources before strict enforcement.

Do not blindly copy a generic CSP.

---

# 20. Secrets and Environment Variables

Mandatory requirement:

> **NEVER expose API keys or secrets in the frontend.**

Server-only secrets include:

- Supabase service-role key
- Resend API key
- Database credentials
- Private application secrets
- Other provider credentials

Only intentionally public values may use public environment-variable prefixes.

Never commit:

```text
.env
.env.local
.env.production
```

or files containing secrets.

If a secret is accidentally committed:

1. Revoke/rotate it immediately.
2. Remove it from active code.
3. Review Git history.
4. Replace the credential.
5. Verify the replacement is server-only.

The Supabase service-role key must never be:

- Imported into client components
- Included in browser bundles
- Returned in API responses
- Stored in localStorage
- Sent to the browser

---

# 21. Email / Resend Security

V1 includes transactional email using the selected email provider.

Email sending must occur from trusted server-side code.

Requirements:

- Keep Resend API key server-side.
- Validate recipient addresses.
- Do not allow arbitrary sender identities.
- Prevent email header injection.
- Rate-limit email-triggering operations.
- Do not expose provider responses containing secrets.
- Avoid logging unnecessary sensitive customer information.

Order-related email events must follow the order state machine defined by the PRD.

---

# 22. Session and Cookie Security

Where authentication uses cookies, apply appropriate:

- `Secure`
- `HttpOnly`
- `SameSite`
- Expiration

Sensitive authentication information should not be placed in localStorage without a documented security reason.

After logout or session invalidation, protected resources must reject the invalid session.

---

# 23. Error Handling and Information Leakage

Production responses must not expose:

- API keys
- Database passwords
- Service-role credentials
- SQL statements
- Internal filesystem paths
- Stack traces
- Internal infrastructure details
- Unnecessary personal information

User-facing errors should be safe and understandable.

Detailed diagnostic information should remain in controlled server-side logs.

---

# 24. Logging and Audit Trail

Important security-sensitive events should be auditable.

Examples:

- Admin login
- Failed administrative authentication
- Role changes
- Product price changes
- Product changes
- Inventory changes
- Payment verification
- Order status changes
- Refund/return operations if included
- Suspicious access attempts
- Important configuration changes

Never log:

- Passwords
- API keys
- Access tokens
- Service-role keys
- Sensitive authentication credentials

If retention is not defined:

**RETENTION POLICY DECISION REQUIRED**

---

# 25. Dependency Security

AI-assisted development can introduce unnecessary or unsafe dependencies.

Requirements:

- Avoid unnecessary packages.
- Review new dependencies before installation.
- Prefer maintained packages.
- Keep dependencies reasonably current.
- Review high/critical vulnerabilities.
- Remove unused packages.
- Do not blindly install packages suggested by AI.

Recommended checks include:

```powershell
pnpm audit
```

and the project's normal:

```powershell
pnpm lint
pnpm build
```

plus relevant tests.

A clean dependency audit does not guarantee complete security.

---

# 26. AI-Generated Code Security Review

This project uses AI-assisted development.

AI-generated code must not be considered secure merely because it compiles or passes basic tests.

Mandatory human review is required for changes involving:

- Authentication
- Authorization
- Middleware
- RLS
- Database queries
- Checkout
- Inventory
- Payment
- File uploads
- API routes
- Server actions
- Environment variables
- Rate limiting

Review specifically for:

- Missing authorization
- Client-trusted values
- Secret exposure
- Unsafe SQL
- Missing validation
- Missing rate limiting
- Incorrect RLS
- Race conditions
- Insecure file handling
- Information leakage
- Unnecessary dependencies

---

# 27. Security Testing

Security tests must be written alongside the relevant feature.

## 27.1 Authentication

Test:

- Unauthenticated access
- Invalid session
- Expired session
- Logout
- Protected resource access

## 27.2 Authorization

Test:

- Customer accessing admin routes
- Customer accessing another customer's order
- Staff attempting owner-only operations
- Unauthorized payment verification
- Privilege escalation attempts

## 27.3 RLS

Test unauthorized:

- SELECT
- INSERT
- UPDATE
- DELETE

for protected tables.

## 27.4 Checkout

Test:

- Manipulated price
- Manipulated total
- Invalid product ID
- Invalid quantity
- Out-of-stock product
- Duplicate submission
- Concurrent final-item checkout

## 27.5 Uploads

Test:

- Invalid extension
- Invalid MIME type
- Invalid file signature
- Oversized file
- Malicious filename
- Path traversal attempt
- Unauthorized file access

## 27.6 API

Test:

- Missing authentication
- Missing authorization
- Malformed input
- Oversized input
- Rate-limit behavior
- Unexpected parameters

## 27.7 Secret exposure

Verify:

- No service-role key appears in client code.
- No Resend API key appears in client code.
- No database credentials appear in client code.
- No secrets appear in committed source files.
- Browser bundles contain no server-only credentials.

---

# 28. Security Acceptance Criteria

V1 security is not complete until all applicable requirements below are satisfied.

- [ ] Admin routes require authentication.
- [ ] Admin routes require authorization.
- [ ] Admin API/server actions are protected.
- [ ] Frontend admin visibility is not treated as authorization.
- [ ] RLS is enabled on all protected tables.
- [ ] Customers cannot access other customers' protected data.
- [ ] Customers cannot modify prices.
- [ ] Customers cannot modify inventory.
- [ ] Customers cannot verify payments.
- [ ] Server recalculates checkout totals.
- [ ] Server validates product availability.
- [ ] Checkout uses transactional inventory protection.
- [ ] PostgreSQL row-level locking is used where required.
- [ ] Checkout concurrency tests pass.
- [ ] Runtime input validation exists for external inputs.
- [ ] Rate limiting exists for sensitive operations.
- [ ] Upload validation is implemented.
- [ ] Payment proof is protected.
- [ ] Private files cannot be accessed by unauthorized users.
- [ ] API secrets remain server-side.
- [ ] Supabase service-role key is never exposed.
- [ ] Resend API key is never exposed.
- [ ] Security headers are configured/tested as appropriate.
- [ ] Production errors do not leak sensitive information.
- [ ] Dependencies have been reviewed.
- [ ] AI-generated security-sensitive code has been reviewed.
- [ ] Security tests pass.
- [ ] No known critical security issue remains unresolved.

---

# 29. Development Security Review Process

Security must be reviewed continuously.

Before accepting a major feature:

1. Review changed files.
2. Review authentication impact.
3. Review authorization impact.
4. Review RLS impact.
5. Review input validation.
6. Review secret handling.
7. Review dependency changes.
8. Review database transactions.
9. Run relevant tests.
10. Review security findings.
11. Commit only after applicable checks pass.

Extra review is required for:

- Authentication
- Admin functionality
- RLS policies
- Checkout
- Inventory
- Payment verification
- File uploads
- API routes
- Server actions
- Environment variables
- Middleware

---

# 30. Known Security Decisions / Open Questions

| Decision | Current Status | Required Before Implementation? | Owner/Phase |
|---|---|---:|---|
| Exact distributed rate-limiting mechanism | DECISION REQUIRED if not finalized by architecture | Yes | Backend/security phase |
| Final session/cookie configuration | Follow selected Supabase Auth architecture | Yes | Authentication phase |
| Final CSP policy | Must be tested against production resources | Before production | Security/SEO phase |
| Log retention period | DECISION REQUIRED if not defined | Before production | Operations/security phase |
| Payment-proof retention policy | DECISION REQUIRED if not defined | Before payment implementation | Payment phase |
| Final storage bucket visibility/policies | Must follow private/public requirements | Yes | Storage phase |

No unresolved decision should be silently converted into an implementation assumption.

---

# 31. V1 Security Priorities

## Priority 1 — Authorization

Protect:

- Admin
- Staff
- Customer data
- Payment verification
- Inventory
- Orders

## Priority 2 — Data integrity

Protect:

- Prices
- Order totals
- Inventory
- Checkout concurrency
- Payment state

## Priority 3 — Input and file security

Protect:

- API endpoints
- Forms
- Search
- Uploads
- Payment proof

## Priority 4 — Abuse protection

Implement:

- Rate limiting
- Brute-force protection
- Upload limits
- Request limits

## Priority 5 — Secrets and infrastructure

Protect:

- Environment variables
- Supabase credentials
- Resend credentials
- Server-only functionality

## Priority 6 — Security testing

Verify:

- Authentication
- Authorization
- RLS
- Checkout concurrency
- Upload security
- API abuse
- Secret exposure

---

# 32. Final Security Rule

The application must never depend on the assumption that users will only use the UI as intended.

A customer can inspect requests, modify form data, call APIs directly, change browser state, and attempt to access URLs manually.

Therefore:

```text
Frontend restrictions
        +
Server-side validation
        +
Server-side authorization
        +
Supabase RLS
        +
PostgreSQL constraints
        +
Transactional concurrency control
        +
Secure storage policies
        +
Rate limiting
        +
Security testing
```

must work together to provide the V1 security boundary.

Security-sensitive functionality is incomplete until it is both implemented and tested.
