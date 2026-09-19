# Mobile Store E-Commerce Platform
# Database Specification

**Version:** V1.0  
**Status:** Development Specification  
**Database:** PostgreSQL via Supabase

---

# 1. Database Principles

PostgreSQL is the source of truth for all business-critical data.

The database must enforce:

- Primary keys
- Foreign keys
- Unique constraints
- NOT NULL constraints where appropriate
- CHECK constraints
- Indexes
- Row Level Security
- Transactional integrity

The browser must never be trusted for:

- Prices
- Stock quantities
- Discounts
- Coupon validity
- Payment status
- User roles
- Order ownership

---

# 2. ID Strategy

Use UUIDs for application entities.

Primary keys should use PostgreSQL-generated UUID values.

Examples:

- users/profiles
- products
- categories
- brands
- orders
- payments
- inventory transactions
- coupons
- banners

Human-readable order numbers should be separate from internal UUIDs.

Example:

Internal ID:
`550e8400-e29b-41d4-a716-446655440000`

Public order number:

`#1042`

The public order number must not be used as the database primary key.

---

# 3. Users and Profiles

Supabase Auth owns authentication identities.

The application database should maintain a profile record associated
with the authenticated Supabase user.

## profiles

Fields:

- id UUID PRIMARY KEY
- full_name TEXT
- email TEXT
- phone TEXT NULL
- avatar_url TEXT NULL
- role TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

Role values:

- customer
- staff
- owner

Default role:

`customer`

The role must never be supplied by an untrusted client.

Role changes must be restricted to authorized owners.

---

# 4. Roles

For V1 use a simple role model.

## owner

Full administrative access.

## staff

Operational access according to future permission rules.

## customer

Customer access only.

The schema should support more granular permissions later without
requiring a redesign of the identity model.

---

# 5. Categories

## categories

Fields:

- id UUID PRIMARY KEY
- name TEXT NOT NULL
- slug TEXT NOT NULL UNIQUE
- description TEXT NULL
- image_url TEXT NULL
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- sort_order INTEGER NOT NULL DEFAULT 0
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

Indexes:

- unique(slug)
- index(is_active)
- index(sort_order)

Categories should normally be archived rather than physically
deleted when historical products/orders depend on them.

---

# 6. Brands

## brands

Fields:

- id UUID PRIMARY KEY
- name TEXT NOT NULL
- slug TEXT NOT NULL UNIQUE
- logo_url TEXT NULL
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

Indexes:

- unique(slug)
- index(is_active)

---

# 7. Products

## products

Fields:

- id UUID PRIMARY KEY
- name TEXT NOT NULL
- slug TEXT NOT NULL UNIQUE
- sku TEXT NOT NULL UNIQUE
- description TEXT NULL
- brand_id UUID NULL
- category_id UUID NOT NULL
- price NUMERIC(12,2) NOT NULL
- compare_at_price NUMERIC(12,2) NULL
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

Constraints:

- price >= 0
- compare_at_price >= 0 when present
- compare_at_price may be greater than price when a discount is
  displayed
- sku must be unique
- slug must be unique

Indexes:

- slug
- sku
- category_id
- brand_id
- is_active
- created_at

Products should normally be archived rather than hard deleted.

Historical order records must remain valid even if a product is
later archived.

---

# 8. Product Media

## product_media

Fields:

- id UUID PRIMARY KEY
- product_id UUID NOT NULL
- media_type TEXT NOT NULL
- storage_path TEXT NOT NULL
- public_url TEXT NULL
- alt_text TEXT NULL
- sort_order INTEGER NOT NULL DEFAULT 0
- is_primary BOOLEAN NOT NULL DEFAULT FALSE
- created_at TIMESTAMPTZ

media_type values may include:

- image
- video

Constraints:

- product_id references products
- storage_path required
- media_type restricted to supported values

Indexes:

- product_id
- product_id + sort_order

Payment proof files must NOT use this table.

---

# 9. Product Specifications

If structured specifications are required, use a flexible JSONB field
or a separate specification table depending on the final UI.

Initial V1 recommendation:

products.specifications JSONB NULL

The application must validate the structure before writing it.

Do not allow arbitrary unvalidated JSON to control application
behavior.

---

# 10. Inventory

Inventory is a core business domain.

Do not rely only on a browser-maintained stock value.

Use an append-only inventory transaction model.

## inventory_transactions

Fields:

- id UUID PRIMARY KEY
- product_id UUID NOT NULL
- transaction_type TEXT NOT NULL
- quantity INTEGER NOT NULL
- reference_type TEXT NULL
- reference_id UUID NULL
- reason TEXT NULL
- created_by UUID NULL
- created_at TIMESTAMPTZ

transaction_type examples:

- initial_stock
- stock_received
- stock_adjustment
- order_reserved
- order_released
- order_cancelled
- return
- damaged
- pos_sale

For stock additions:

`quantity > 0`

For stock deductions:

`quantity < 0`

The database should enforce:

`quantity <> 0`

---

# 11. Current Inventory

A current inventory table may be maintained for efficient reads.

## inventory

Fields:

- product_id UUID PRIMARY KEY
- available_quantity INTEGER NOT NULL DEFAULT 0
- reserved_quantity INTEGER NOT NULL DEFAULT 0
- updated_at TIMESTAMPTZ

Constraints:

- available_quantity >= 0
- reserved_quantity >= 0

The inventory transaction ledger remains the audit source.

Inventory updates must happen inside controlled database
transactions.

The browser must never update this table directly.

---

# 12. Inventory Integrity

Any operation that changes stock must:

1. Validate authorization
2. Lock the relevant inventory row
3. Validate resulting stock
4. Update inventory state
5. Insert the corresponding inventory transaction
6. Commit atomically

A stock change must never update inventory without recording an
appropriate transaction.

---

# 13. Customers and Guest Customers

Authenticated customers are represented through:

profiles.id → auth.users.id

Guest customers do not require an auth account.

Order records must contain the customer information necessary to
fulfill historical orders.

Do not depend entirely on the customer's current profile for
historical order information.

---

# 14. Orders

## orders

Fields:

- id UUID PRIMARY KEY
- order_number BIGINT UNIQUE
- customer_id UUID NULL
- customer_name TEXT NOT NULL
- customer_email TEXT NULL
- customer_phone TEXT NOT NULL
- province TEXT NOT NULL
- district TEXT NOT NULL
- municipality TEXT NOT NULL
- area TEXT NULL
- address TEXT NOT NULL
- delivery_notes TEXT NULL
- subtotal NUMERIC(12,2) NOT NULL
- discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0
- delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0
- total_amount NUMERIC(12,2) NOT NULL
- coupon_id UUID NULL
- payment_method TEXT NOT NULL
- payment_status TEXT NOT NULL
- order_status TEXT NOT NULL
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

customer_id is NULL for guest orders.

Historical customer details must remain stored on the order.

---

# 15. Order Number

Internal order ID:

UUID

Customer-facing order number:

BIGINT

Example:

`1042`

Order numbers should be generated safely by PostgreSQL.

Never generate order numbers using:

`MAX(order_number) + 1`

because concurrent orders can produce duplicates.

---

# 16. Order Items

## order_items

Fields:

- id UUID PRIMARY KEY
- order_id UUID NOT NULL
- product_id UUID NULL
- product_name TEXT NOT NULL
- sku TEXT NOT NULL
- quantity INTEGER NOT NULL
- unit_price NUMERIC(12,2) NOT NULL
- discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0
- line_total NUMERIC(12,2) NOT NULL
- created_at TIMESTAMPTZ

product_id may be nullable for historical resilience if a product is
later archived/deleted from the active catalogue.

Historical product name, SKU and price must remain stored.

Constraints:

- quantity > 0
- unit_price >= 0
- discount_amount >= 0
- line_total >= 0

Indexes:

- order_id
- product_id

---

# 17. Order Status

Allowed order states:

- pending
- payment_verification
- confirmed
- processing
- shipped
- delivered
- cancelled
- payment_rejected
- returned
- refund_pending
- refunded

The application should restrict invalid state transitions.

Example:

pending
→ confirmed

confirmed
→ processing

processing
→ shipped

shipped
→ delivered

Not every state transition should be allowed.

---

# 18. Payment Status

Allowed payment states:

- pending
- awaiting_verification
- verified
- rejected
- failed
- refunded

COD may begin as:

`pending`

Manual QR payment begins as:

`awaiting_verification`

A screenshot upload must never automatically set:

`verified`

---

# 19. Payments

## payments

Fields:

- id UUID PRIMARY KEY
- order_id UUID NOT NULL
- payment_method TEXT NOT NULL
- amount NUMERIC(12,2) NOT NULL
- status TEXT NOT NULL
- provider TEXT NULL
- provider_reference TEXT NULL
- verified_by UUID NULL
- verified_at TIMESTAMPTZ NULL
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

V1 payment methods:

- cod
- manual_qr

Future:

- esewa
- khalti
- other

The schema must not require a gateway-specific field to exist for
every payment.

---

# 20. Payment Proofs

## payment_proofs

Fields:

- id UUID PRIMARY KEY
- payment_id UUID NOT NULL
- storage_path TEXT NOT NULL
- original_filename TEXT NULL
- mime_type TEXT NOT NULL
- file_size INTEGER NOT NULL
- uploaded_by UUID NULL
- created_at TIMESTAMPTZ

Payment proof files must be stored in private storage.

Only authorized staff/owners may access them.

Customers must not be able to access another customer's payment
proof.

---

# 21. Payment Verification

Payment verification must record:

- Who verified/rejected it
- When
- Previous state
- New state
- Optional reason

Important payment state changes should be auditable.

---

# 22. Coupons

## coupons

Fields:

- id UUID PRIMARY KEY
- code TEXT NOT NULL UNIQUE
- description TEXT NULL
- discount_type TEXT NOT NULL
- discount_value NUMERIC(12,2) NOT NULL
- minimum_order_value NUMERIC(12,2) NULL
- maximum_discount NUMERIC(12,2) NULL
- usage_limit INTEGER NULL
- usage_count INTEGER NOT NULL DEFAULT 0
- starts_at TIMESTAMPTZ NULL
- expires_at TIMESTAMPTZ NULL
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

discount_type:

- percentage
- fixed

Constraints:

- discount_value > 0
- percentage <= 100
- usage_count >= 0
- usage_limit > 0 when present

Coupon codes should be normalized consistently, for example
uppercase.

---

# 23. Coupon Usage

## coupon_usages

Fields:

- id UUID PRIMARY KEY
- coupon_id UUID NOT NULL
- order_id UUID NOT NULL
- customer_id UUID NULL
- discount_amount NUMERIC(12,2) NOT NULL
- created_at TIMESTAMPTZ

Indexes:

- coupon_id
- order_id
- customer_id

Unique constraints should prevent duplicate usage where the
business rules require it.

Coupon usage must be recorded inside the checkout transaction.

---

# 24. Homepage Banners

## banners

Fields:

- id UUID PRIMARY KEY
- title TEXT NOT NULL
- description TEXT NULL
- image_path TEXT NOT NULL
- link_url TEXT NULL
- sort_order INTEGER NOT NULL DEFAULT 0
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- starts_at TIMESTAMPTZ NULL
- ends_at TIMESTAMPTZ NULL
- created_by UUID NULL
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

Indexes:

- is_active
- sort_order
- starts_at
- ends_at

---

# 25. Delivery Zones / Shipping Rates

V1 must support delivery charges without hard-coding them in the
frontend.

## shipping_zones

Fields:

- id UUID PRIMARY KEY
- name TEXT NOT NULL
- province TEXT NULL
- district TEXT NULL
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ

## shipping_rates

Fields:

- id UUID PRIMARY KEY
- zone_id UUID NOT NULL
- rate NUMERIC(12,2) NOT NULL
- free_shipping_threshold NUMERIC(12,2) NULL
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

The exact shipping rules can remain simple in V1.

The architecture must allow expansion later.

The server determines the final delivery charge.

---

# 26. Order Status History

## order_status_history

Fields:

- id UUID PRIMARY KEY
- order_id UUID NOT NULL
- previous_status TEXT NULL
- new_status TEXT NOT NULL
- changed_by UUID NULL
- note TEXT NULL
- created_at TIMESTAMPTZ

This provides an audit trail for important order state changes.

Indexes:

- order_id
- created_at

---

# 27. Inventory References

Inventory transactions should reference the business event that
caused them.

Examples:

reference_type:

- order
- pos
- adjustment
- return
- purchase

reference_id:

UUID of the related record.

This allows future POS transactions to use the same inventory
system.

---

# 28. Audit Logs

## audit_logs

Fields:

- id UUID PRIMARY KEY
- actor_id UUID NULL
- action TEXT NOT NULL
- entity_type TEXT NOT NULL
- entity_id UUID NULL
- metadata JSONB NULL
- created_at TIMESTAMPTZ

Examples:

- product_price_changed
- stock_adjusted
- payment_verified
- payment_rejected
- order_status_changed
- coupon_created
- banner_updated
- staff_role_changed

Do not store passwords, API keys or sensitive credentials.

---

# 29. Email Events

## email_events

Fields:

- id UUID PRIMARY KEY
- order_id UUID NULL
- recipient_email TEXT NOT NULL
- email_type TEXT NOT NULL
- status TEXT NOT NULL
- provider_message_id TEXT NULL
- error_message TEXT NULL
- sent_at TIMESTAMPTZ NULL
- created_at TIMESTAMPTZ

email_type examples:

- order_placed
- payment_verified
- payment_rejected
- order_confirmed
- order_shipped
- order_delivered
- order_cancelled

Email events are operational records and should not control order
state.

---

# 30. Future Delivery Fields

The order model should eventually support:

- delivery_provider
- delivery_provider_order_id
- tracking_id
- delivery_status
- delivery_metadata

These may be added through a migration when delivery integration is
implemented.

Do not add unnecessary provider-specific fields to V1 unless
required.

---

# 31. Future POS

A future POS sale should create:

- an order/sale record
- order items
- inventory transaction
- payment record

The POS must use the same inventory source of truth.

The system must NOT maintain:

online_stock

and

pos_stock

as separate independent values.

---

# 32. Relationships

Core relationships:

auth.users
    |
    +---- profiles

categories
    |
    +---- products

brands
    |
    +---- products

products
    |
    +---- product_media

products
    |
    +---- inventory

products
    |
    +---- inventory_transactions

profiles
    |
    +---- orders

orders
    |
    +---- order_items

orders
    |
    +---- payments

payments
    |
    +---- payment_proofs

orders
    |
    +---- order_status_history

coupons
    |
    +---- coupon_usages

banners
    |
    +---- profiles (created_by)

---

# 33. Important Foreign Key Rules

Use foreign keys for relationships.

Examples:

products.category_id
→ categories.id

products.brand_id
→ brands.id

product_media.product_id
→ products.id

inventory.product_id
→ products.id

inventory_transactions.product_id
→ products.id

orders.customer_id
→ profiles.id

order_items.order_id
→ orders.id

payments.order_id
→ orders.id

payment_proofs.payment_id
→ payments.id

coupon_usages.coupon_id
→ coupons.id

coupon_usages.order_id
→ orders.id

---

# 34. Deletion Strategy

Avoid destructive deletion of business records.

Prefer:

`is_active = false`

or

`archived_at`

for:

- Products
- Categories
- Brands
- Coupons
- Banners

Orders, payments and inventory transactions should generally never
be physically deleted through normal admin workflows.

Historical business records must remain auditable.

---

# 35. RLS Strategy

RLS is mandatory.

## Public

Can read only explicitly public:

- active products
- active categories
- active brands
- active banners
- publicly visible product media

## Customer

Can:

- Read own profile
- Update permitted profile fields
- Read own orders
- Read own order items
- Read permitted order status information

Cannot:

- Read another customer's orders
- Read payment proofs
- Change payment status
- Change inventory
- Change product prices
- Change roles

## Staff

Can perform authorized operational actions.

## Owner

Full application administration.

RLS must be written explicitly for every exposed table.

Do not assume that hiding a UI element provides security.

---

# 36. RLS and Service Role

The Supabase service-role key bypasses RLS.

Therefore:

- It must never be exposed to clients.
- It must only be used in trusted server-side code.
- Its use should be minimized.
- Operations that can safely use normal authenticated RLS should
  prefer RLS.

---

# 37. Checkout Transaction

Checkout must execute critical operations atomically.

Conceptual transaction:

BEGIN

1. Validate authenticated user if applicable
2. Validate guest/customer information
3. Fetch requested products
4. Lock relevant inventory rows
5. Re-check stock
6. Validate product availability
7. Validate current prices
8. Validate coupon
9. Calculate subtotal
10. Calculate discount
11. Calculate delivery fee
12. Calculate final total
13. Create order
14. Create order items
15. Create payment record
16. Create inventory transaction/reservation
17. Record coupon usage if applicable
18. Record order status history

COMMIT

If any step fails:

ROLLBACK

No partial order should remain.

---

# 38. Row-Level Locking

The checkout implementation must use PostgreSQL row-level locking
for inventory-sensitive operations.

Conceptually:

SELECT ...
FROM inventory
WHERE product_id = ...
FOR UPDATE;

The exact SQL implementation may use a PostgreSQL function/RPC or
another server-controlled transactional mechanism.

The critical requirement is that the stock check and stock update
occur within the same transaction while the relevant row is locked.

---

# 39. Overselling Example

Initial stock:

`1`

Customer A requests:

`1`

Customer B requests:

`1`

Correct behavior:

Customer A:

- Locks inventory
- Sees stock = 1
- Creates valid order
- Deducts/reserves stock
- Commits

Customer B:

- Waits for lock
- Re-reads stock
- Sees stock = 0
- Checkout fails safely

Result:

Stock does not become `-1`.

Only one successful order is created.

---

# 40. Concurrency Testing

Automated tests must simulate concurrent purchases.

Test cases:

### Test 1

Stock = 1

Two simultaneous purchases of quantity 1.

Expected:

- One succeeds
- One fails

### Test 2

Stock = 5

Two simultaneous purchases:

3 + 3

Expected:

- Total successful quantity <= 5

### Test 3

Stock = 5

Concurrent purchases and cancellation.

Expected:

- Inventory remains consistent

### Test 4

Failed checkout during transaction.

Expected:

- No partial inventory deduction
- No partial order
- No incorrect coupon usage

---

# 41. Indexing Strategy

Indexes should exist for frequent queries.

Important indexes include:

products:

- slug
- sku
- category_id
- brand_id
- is_active

orders:

- order_number
- customer_id
- order_status
- payment_status
- created_at

order_items:

- order_id
- product_id

inventory:

- product_id

inventory_transactions:

- product_id
- reference_id
- created_at

payments:

- order_id
- status

payment_proofs:

- payment_id

coupons:

- code
- is_active

coupon_usages:

- coupon_id
- order_id

banners:

- is_active
- sort_order

Indexes should be validated against real query patterns rather than
adding indexes unnecessarily.

---

# 42. Monetary Values

Do NOT use floating-point database types for money.

Use:

`NUMERIC(12,2)`

for:

- prices
- discounts
- delivery fees
- totals
- payment amounts

All server-side calculations must maintain monetary precision.

---

# 43. Timestamps

Use:

`TIMESTAMPTZ`

for timestamps.

Store timestamps in UTC at the database/application level.

Display localized times appropriately in the admin interface.

---

# 44. Phone Numbers

Phone numbers should be stored as TEXT.

Do not use INTEGER.

Reason:

- Leading zeros may matter
- Country codes may be used
- Phone numbers are identifiers, not quantities

Validation should occur at the application boundary.

---

# 45. Database Security

Never expose:

- database passwords
- service-role keys
- private storage credentials

Do not allow anonymous clients to perform arbitrary SQL.

All database access must go through controlled Supabase APIs,
server-side logic, or authorized database functions.

---

# 46. Storage Security

Recommended logical buckets:

## product-media

Public-readable media intended for storefront use.

## banners

Public-readable promotional media.

## payment-proofs

Private bucket.

Payment proof access requires authorization.

Storage policies must be tested separately from database RLS.

---

# 47. Migration Strategy

All database schema changes must be represented as migrations.

Example:

supabase/
    migrations/
        001_initial_schema.sql
        002_rls_policies.sql
        003_inventory.sql
        ...

Do not manually modify production schema without a corresponding
migration.

---

# 48. Seed Data

Development/staging may contain seed data.

Production must not contain:

- fake customer accounts
- fake orders
- fake payments
- fake analytics
- demo products unless they are actual store products

The current v0 mock data must eventually be replaced with real
database data.

---

# 49. Database Backup

Before production:

- Confirm backup availability
- Confirm retention
- Document recovery procedure
- Test restoration procedure where supported

The selected Supabase plan must be evaluated against the required
backup/recovery capability.

---

# 50. Database Security Testing

Test:

- Customer cannot access another customer's order
- Customer cannot modify order totals
- Customer cannot modify payment status
- Customer cannot modify stock
- Customer cannot change their role
- Staff cannot perform owner-only actions
- Anonymous users cannot access private data
- Payment proofs cannot be publicly accessed
- Direct API requests cannot bypass RLS

---

# 51. Future Compatibility

The database must remain extensible for:

- POS
- eSewa
- Khalti
- Delivery providers
- WhatsApp
- SMS
- Additional staff permissions

Future integrations should reference stable internal IDs rather than
depending on provider-specific IDs as primary keys.

---

# 52. Database Definition of Done

The database design is complete when:

- All V1 entities are defined
- Relationships are defined
- Foreign keys are defined
- Constraints are defined
- Indexes are defined
- Order lifecycle is defined
- Payment lifecycle is defined
- Inventory ledger is defined
- Inventory concurrency is defined
- RLS strategy is defined
- Storage security is defined
- Guest checkout is supported
- Google-authenticated customers are supported
- Future POS is supported
- Future payment gateways are supported
- Delivery extension points are defined
- Auditability is defined
- Migration strategy is defined
- Concurrency tests are defined