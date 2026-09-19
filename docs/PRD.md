# Mobile Store E-Commerce Platform
## Product Requirements Document (PRD)

**Version:** V1.0  
**Status:** Development Specification  
**Target Market:** Nepal  
**Platform:** Responsive Web Application  
**Primary Users:** Customers, Store Owner, Staff

---

# 1. Product Overview

This project is a production-ready e-commerce platform for an
offline mobile phone and accessories store in Nepal.

The system will allow the store to move its product catalogue,
sales, inventory and order management online while giving the store
owner a simple dashboard that can be operated without technical
knowledge.

The platform must be designed so that future capabilities such as:

- POS
- eSewa/Khalti/payment gateways
- delivery partner integrations
- WhatsApp notifications
- additional staff roles
- advanced analytics

can be added without requiring a complete rewrite of the system.

---

# 2. Product Goals

## 2.1 Customer Goals

Customers should be able to:

- Browse products
- Search products
- Filter products
- View product details
- View product images/media
- Add products to cart
- Change quantities
- Checkout
- Choose COD
- Choose manual online payment
- Upload payment proof
- Provide delivery information
- Optionally sign in with Google
- View their orders when authenticated
- Receive order-related email notifications

The checkout process should be simple and mobile-friendly.

---

## 2.2 Store Owner Goals

The store owner should be able to:

- Add products
- Edit products
- Remove/archive products
- Upload product images
- Upload product videos where supported
- Manage product categories
- Manage brands
- Manage product pricing
- Manage stock
- View inventory
- View inventory history
- View orders
- View order details
- Update order status
- Verify manual online payments
- View payment screenshots
- Accept/reject payment verification
- Manage coupons/vouchers
- Create and manage homepage banners
- Change promotional content without developer assistance
- View customers
- View sales information
- View best-selling products
- View basic business analytics

The dashboard must prioritize simplicity and minimize technical
complexity for the store owner.

---

# 3. V1 Scope

V1 includes the following major systems:

1. Customer storefront
2. Product catalogue
3. Search and filtering
4. Shopping cart
5. Guest checkout
6. Optional Google authentication
7. Customer accounts
8. COD orders
9. Manual QR-based online payment
10. Payment proof upload
11. Manual payment verification
12. Order management
13. Inventory management
14. Inventory transaction history
15. Product management
16. Product media management
17. Category management
18. Brand management
19. Coupon/voucher management
20. Homepage/banner management
21. Customer management
22. Sales analytics
23. Best-selling product analytics
24. Transactional email notifications
25. Production-grade security
26. SEO-friendly storefront

---

# 4. Explicitly NOT in V1

The following are intentionally deferred.

## Payments

- eSewa integration
- Khalti integration
- Other payment gateway integrations
- Automated payment gateway callbacks

V1 uses:

- COD
- Manual QR payment
- Payment screenshot upload
- Manual admin verification

The architecture must allow future payment gateway integration
without redesigning the order system.

---

## Delivery

V1 does NOT integrate directly with:

- Pathao Parcel
- Other delivery APIs
- Automated shipping label generation
- Automated delivery tracking

The store will handle delivery manually.

The data model should leave room for future delivery partner
integration.

---

## POS

A POS system is NOT part of V1.

However, the database and inventory architecture must be designed
so that a future POS can create sales and inventory transactions
without conflicting with online orders.

---

## Notifications

V1 includes transactional email.

V1 does NOT include:

- WhatsApp notifications
- SMS notifications

These may be added later.

---

# 5. User Types

## 5.1 Guest Customer

A guest can:

- Browse products
- Search products
- Add products to cart
- Checkout
- Provide name
- Provide phone number
- Provide delivery address
- Choose payment method
- Upload payment proof for manual online payment

Guest checkout must NOT require Google authentication.

---

## 5.2 Authenticated Customer

A customer can optionally sign in using Google.

Authenticated customers can:

- View their account
- View previous orders
- View order details
- Access order history

Authentication should improve the experience but should not be
required to purchase.

The customer's phone number is collected during checkout because
it is required for delivery/contact purposes.

---

## 5.3 Staff

The system should support a staff role in the data model even if
the first deployment only has one owner/admin.

Staff permissions should eventually allow limited operational
actions without giving unrestricted access to sensitive settings.

---

## 5.4 Owner

The owner has full administrative access.

Owner capabilities include:

- Products
- Inventory
- Orders
- Customers
- Payments
- Coupons
- Banners
- Analytics
- Store settings
- Staff management

Authorization must be enforced server-side and through database
security policies.

---

# 6. Customer Storefront

The storefront should contain:

## Homepage

- Hero/banner
- Promotional content
- Featured products
- Categories
- Best-selling products
- New products where applicable
- Store information

Homepage promotional content must be manageable from the admin
dashboard.

The owner must not need a developer to change banners.

---

## Product Listing

Customers can:

- Browse products
- Filter by category
- Filter by brand
- Filter by price where appropriate
- Sort products
- Search products
- See stock availability

---

## Product Details

Each product should support:

- Product name
- Brand
- Category
- Description
- Price
- Discount/compare-at price
- Stock availability
- Product images
- Product media
- Specifications where applicable
- Related products

---

# 7. Shopping Cart

The cart must allow customers to:

- Add products
- Remove products
- Increase quantity
- Decrease quantity
- See subtotal
- See applicable discount
- See delivery charge
- See final total

The server must never trust prices or quantities supplied by the
browser.

Final pricing must be calculated and validated server-side.

---

# 8. Checkout

Checkout must collect:

## Customer Information

- Full name
- Phone number
- Email where available

## Delivery Information

- Province
- District
- Municipality/City
- Area
- Address
- Optional delivery notes

## Payment Method

### COD

Customer places order using Cash on Delivery.

### Manual Online Payment

Customer:

1. Selects online payment
2. Sees the store's configured QR code/payment information
3. Pays using their payment application
4. Uploads payment screenshot/proof
5. Places order
6. Order enters payment verification state
7. Admin reviews payment
8. Admin verifies or rejects payment
9. Order proceeds only after successful verification

The payment amount must be displayed clearly.

The system must never treat an uploaded screenshot alone as proof
that payment was actually received.

---

# 9. Order Lifecycle

Orders should use explicit states.

Example lifecycle:

Pending
→ Payment Verification
→ Confirmed
→ Processing
→ Shipped
→ Delivered

Additional states may include:

- Cancelled
- Payment Rejected
- Returned
- Refund Pending
- Refunded

The exact implementation should preserve the ability to support
returns/refunds later.

Every important order state transition should be auditable.

---

# 10. Inventory

Inventory is a core V1 feature.

The system must maintain reliable stock information.

Inventory must use an append-only transaction model rather than
relying only on manually changing a single stock number.

Inventory transactions may represent:

- Initial stock
- Stock addition
- Stock adjustment
- Online order reservation/deduction
- Order cancellation/restoration
- Return
- Damaged stock
- Future POS sale

Every inventory-changing action should have an auditable record.

---

# 11. Checkout Concurrency

The system must prevent overselling.

When multiple customers attempt to purchase the last available
quantity simultaneously, checkout must use a PostgreSQL transaction
with appropriate row-level locking.

The implementation must use PostgreSQL row-level locking, such as:

SELECT ... FOR UPDATE

during the checkout transaction where appropriate.

The checkout transaction must:

1. Lock the relevant inventory/product rows
2. Re-check current stock
3. Validate the requested quantity
4. Calculate/validate pricing
5. Create the order
6. Create the required inventory transaction
7. Commit atomically

If stock is insufficient, the transaction must fail safely.

Concurrency tests must be written alongside checkout/inventory
implementation rather than being deferred until the final testing
phase.

---

# 12. Product Management

Admin must be able to:

- Create product
- Edit product
- Archive product
- Change price
- Set discount price
- Change category
- Change brand
- Manage description
- Manage specifications
- Manage stock
- Manage images
- Manage product media

Products should use SEO-friendly slugs.

---

# 13. Product Media

The owner must be able to manage product media without developer
assistance.

The system should support:

- JPG
- JPEG
- PNG
- WebP where appropriate

Image uploads should be validated.

Images should be optimized before/while being served.

Large original uploads must not automatically result in large
unoptimized files being delivered to customers.

Video support should be designed so that it can be extended without
restructuring product data.

Bulk media upload/optimization should be considered for future
catalog migration.

---

# 14. Categories and Brands

Admin can:

- Create category
- Edit category
- Archive category
- Create brand
- Edit brand
- Archive brand

Categories and brands should have stable identifiers and
SEO-friendly slugs.

---

# 15. Coupons / Vouchers

Admin can:

- Create coupon
- Enable/disable coupon
- Set fixed discount
- Set percentage discount
- Set expiry
- Set usage limits where required
- Set minimum order value where required

Coupon validation must happen server-side.

Customers must never be able to manipulate the discount by modifying
frontend values.

---

# 16. Homepage/Banner Management

The owner must be able to change homepage promotional banners
through the admin dashboard.

The owner should be able to:

- Upload banner image
- Replace banner image
- Set title
- Set promotional text
- Set destination link
- Enable/disable banner
- Set display order

No developer involvement should be required for normal banner
changes.

---

# 17. Admin Dashboard

The dashboard should be minimal and easy for a non-technical store
owner to operate.

Main areas:

- Overview
- Orders
- Products
- Inventory
- Payments
- Customers
- Coupons
- Banners
- Categories
- Brands
- Analytics
- Settings

The dashboard should prioritize the most frequently used actions.

---

# 18. Dashboard Analytics

The dashboard should provide useful business information such as:

- Total sales
- Number of orders
- Pending orders
- Confirmed orders
- Delivered orders
- Best-selling products
- Sales by period
- Low-stock products
- Inventory overview

Analytics should be based on real database data.

No fake/mock analytics should remain in production.

---

# 19. Customer Emails

V1 includes transactional email.

Emails should be sent for relevant order events, such as:

- Order placed
- Payment verified/rejected where applicable
- Order status updates

Email delivery should be implemented through a transactional email
provider such as Resend.

Email sending must happen securely from server-side code.

API keys must never be exposed to the browser.

Email failures should not corrupt the order transaction.

---

# 20. Authentication

Google Sign-In will be the primary customer authentication
mechanism.

Guest checkout remains available.

Authentication must be implemented using a secure managed
authentication system.

Customer identity must not be trusted from client-supplied IDs.

---

# 21. Authorization

Authentication and authorization are separate concerns.

The application must verify permissions server-side.

Admin access must not rely on:

- Hidden buttons
- Hidden links
- Client-side state
- Frontend route checks alone

Database Row Level Security must protect data at the database layer.

---

# 22. Security Requirements

Security is a primary requirement, not a final-stage feature.

The system must include:

- No secrets in frontend code
- No API keys exposed to browsers
- Server-side authorization
- PostgreSQL RLS
- Server-side input validation
- Rate limiting
- Secure authentication
- Secure file upload validation
- Safe image handling
- Protection against XSS
- Protection against injection attacks
- Protection against IDOR
- Protection against privilege escalation
- Secure order/payment validation
- Security headers
- Dependency auditing
- Regular code/security review

AI-generated code must be reviewed before being accepted into the
production codebase.

Frontend restrictions must never be treated as security controls.

---

# 23. SEO Requirements

The storefront must be designed for strong organic search visibility.

Requirements include:

- Unique page titles
- Meta descriptions
- Canonical URLs
- SEO-friendly product slugs
- SEO-friendly category slugs
- Sitemap
- robots.txt
- Product structured data
- Organization structured data
- Breadcrumb structured data where appropriate
- Open Graph metadata
- Social sharing metadata
- Descriptive image alt text
- Semantic HTML
- Proper heading hierarchy
- Internal linking
- Fast page loading
- Mobile-first responsive design
- Indexable product/category pages

Production metadata must use the actual store domain.

Development placeholder domains must not remain in production.

The v0 generator metadata must also be removed from production.

---

# 24. Performance Requirements

The website should feel fast on typical Nepal mobile connections.

Requirements include:

- Optimized images
- Responsive image sizes
- Lazy loading where appropriate
- Minimal client-side JavaScript
- Server rendering where appropriate
- Efficient database queries
- Pagination for large datasets
- Proper database indexes
- Avoid unnecessary API calls
- Avoid loading large media unnecessarily

---

# 25. Future Compatibility

The V1 architecture must leave clear extension points for:

## Payment

- eSewa
- Khalti
- Other payment gateways

## Delivery

- Pathao Parcel
- Other delivery providers

## POS

A future POS should be able to create sales against the same
product/inventory system.

## Notifications

- WhatsApp
- SMS

## Staff

Additional roles and permissions.

These features are NOT to be implemented in V1 unless explicitly
added to scope.

---

# 26. Data Integrity Principles

The system must treat the database as the source of truth.

The browser must not be trusted for:

- Product price
- Stock quantity
- Discount amount
- Coupon validity
- Order ownership
- Payment status
- Admin privileges

Critical operations must be validated server-side.

Inventory and order changes must be auditable.

---

# 27. V1 Definition of Done

V1 is complete when:

- Customers can browse real database products
- Customers can search/filter products
- Customers can use the cart
- Guests can checkout
- Google authentication works
- COD orders work
- Manual QR payment works
- Payment proof can be uploaded securely
- Admin can verify/reject payments
- Orders are stored correctly
- Order status can be managed
- Inventory is tracked correctly
- Concurrent checkout cannot oversell stock
- Products can be managed from the dashboard
- Product media can be managed from the dashboard
- Banners can be managed from the dashboard
- Coupons work securely
- Customers can view their orders
- Transactional emails work
- Admin authorization works
- RLS policies are implemented
- Rate limiting is implemented
- Security validation is completed
- SEO fundamentals are implemented
- Production TypeScript builds do not ignore errors
- No development/demo data remains in production

---

# 28. Explicit Non-Goals

The project should not become unnecessarily complex.

V1 should NOT attempt to build:

- A full ERP
- A full accounting system
- A full warehouse management system
- A full POS
- A custom payment gateway
- A custom delivery network
- A social network
- Advanced recommendation AI
- Complex loyalty systems

The goal is a secure, maintainable and easy-to-operate e-commerce
platform for the store's initial online business.