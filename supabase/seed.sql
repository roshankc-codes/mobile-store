-- =============================================================================
-- Seed Data: Categories, Brands, Products, Media, Inventory
-- Mobile Store E-Commerce Platform
-- =============================================================================
-- Uses ON CONFLICT DO UPDATE / DO NOTHING for idempotent execution.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active)
VALUES
  ('cbdfcf0c-2d5a-5c97-a673-3d0b01c7bc01', 'Smartphones', 'smartphones', 'Flagship and everyday phones from the brands people trust.', 1, TRUE),
  ('cd071265-a407-5543-9fa3-a1de03000d21', 'Earbuds & Audio', 'audio', 'Wireless earbuds and headphones for calls, music and travel.', 2, TRUE),
  ('cead0973-cc7e-5f1d-bfe0-456224ee7a7e', 'Power & Charging', 'power-charging', 'Fast chargers and power banks to keep you running all day.', 3, TRUE),
  ('4ac03dbd-99da-5379-b59a-fe82785ff4c7', 'Cases & Protection', 'cases-protection', 'Rugged cases and screen protection built for daily life.', 4, TRUE),
  ('e7b00b88-46d3-52e6-900c-414774b37c08', 'Cables & Adapters', 'cables-adapters', 'Durable cables and adapters that just work.', 5, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- -----------------------------------------------------------------------------
-- Brands
-- -----------------------------------------------------------------------------
INSERT INTO public.brands (id, name, slug, is_active)
VALUES
  ('c1a99b72-9133-5404-b6a3-5efe789bc868', 'Samsung', 'samsung', TRUE),
  ('cfb407a4-cafe-54d1-98b3-c6e1d4302408', 'Apple', 'apple', TRUE),
  ('737e6ae2-0de0-5216-aa4d-447acfd0a88c', 'Xiaomi', 'xiaomi', TRUE),
  ('071319e5-78ab-54de-9861-83ba456460a3', 'Google', 'google', TRUE),
  ('2eba0ffb-ef90-536f-ae84-6e57afcb0508', 'Realme', 'realme', TRUE),
  ('8301435d-1089-578d-940c-b64471a44d4a', 'JBL', 'jbl', TRUE),
  ('76358b6b-bdbf-5258-bbe5-dd60604de740', 'Anker', 'anker', TRUE),
  ('5d15b193-8ded-5e20-ac7e-b452dadb786e', 'Spigen', 'spigen', TRUE),
  ('a7ed3124-524e-53aa-9fe3-910c3d6f5f72', 'Baseus', 'baseus', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('7799298d-0114-588a-9be3-9f24cc17bd80', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'SAM-S24U-256', 'The Galaxy S24 Ultra pairs a titanium frame with a brilliant 6.8-inch display and a 200MP camera system. Built-in Galaxy AI tools make everyday tasks faster, while the 5000mAh battery keeps up with a full day of work and play.', '[]'::jsonb, 'c1a99b72-9133-5404-b6a3-5efe789bc868', 'cbdfcf0c-2d5a-5c97-a673-3d0b01c7bc01', 184999, 199999, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('64df3fbb-95d5-558b-9dc5-ffc79a03b400', 'Apple iPhone 15 Pro', 'apple-iphone-15-pro', 'APL-IP15P-256', 'iPhone 15 Pro brings a strong-yet-light titanium design, the powerful A17 Pro chip and a versatile Pro camera system. The customisable Action button and USB-C connectivity make it more flexible than ever.', '[]'::jsonb, 'cfb407a4-cafe-54d1-98b3-c6e1d4302408', 'cbdfcf0c-2d5a-5c97-a673-3d0b01c7bc01', 179900, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('31e0bdc4-8f1d-5dca-b663-f5235d2baee4', 'Xiaomi Redmi Note 13 Pro', 'xiaomi-redmi-note-13-pro', 'XIA-RN13P-256', 'The Redmi Note 13 Pro delivers flagship-grade features at a mid-range price: a sharp 120Hz AMOLED screen, a 200MP main camera and 67W fast charging that tops up the 5100mAh battery in under an hour.', '[]'::jsonb, '737e6ae2-0de0-5216-aa4d-447acfd0a88c', 'cbdfcf0c-2d5a-5c97-a673-3d0b01c7bc01', 42999, 47999, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('b9a5dc1c-01e9-551b-acce-e54608f54691', 'Google Pixel 8', 'google-pixel-8', 'GOO-PIX8-128', 'Pixel 8 is powered by Google Tensor G3 and the most helpful set of AI features on a phone. Its camera captures stunning photos in any light, backed by seven years of OS and security updates.', '[]'::jsonb, '071319e5-78ab-54de-9861-83ba456460a3', 'cbdfcf0c-2d5a-5c97-a673-3d0b01c7bc01', 89999, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('937309e2-73af-52a9-a7da-f6adb90187bc', 'Realme 12 Pro+', 'realme-12-pro-plus', 'REA-12PP-256', 'The Realme 12 Pro+ stands out with a periscope telephoto camera and an elegant curved AMOLED display. Fast 67W charging and a dependable 5000mAh battery round out a well-balanced package.', '[]'::jsonb, '2eba0ffb-ef90-536f-ae84-6e57afcb0508', 'cbdfcf0c-2d5a-5c97-a673-3d0b01c7bc01', 54999, 59999, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('9f33c92c-dade-51cb-ae8e-61466e1313ad', 'Samsung Galaxy A55 5G', 'samsung-galaxy-a55', 'SAM-A55-128', 'The Galaxy A55 5G brings a premium metal frame, a smooth Super AMOLED display and reliable cameras to the mid-range. IP67 water resistance and long software support make it a safe everyday choice.', '[]'::jsonb, 'c1a99b72-9133-5404-b6a3-5efe789bc868', 'cbdfcf0c-2d5a-5c97-a673-3d0b01c7bc01', 51999, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('c2e160b4-0d30-5581-b6e5-3051b41d52e1', 'Apple AirPods Pro (2nd gen)', 'apple-airpods-pro-2', 'APL-APP2-USBC', 'AirPods Pro (2nd generation) deliver richer sound with up to 2x more Active Noise Cancellation. Adaptive Audio tailors noise control to your surroundings, and the USB-C case adds up to 30 hours of total battery.', '[]'::jsonb, 'cfb407a4-cafe-54d1-98b3-c6e1d4302408', 'cd071265-a407-5543-9fa3-a1de03000d21', 34999, 38999, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('bb6a3075-deae-55bd-b474-882546faaaa2', 'JBL Tune Buds', 'jbl-tune-buds', 'JBL-TUNE-BUDS', 'JBL Tune Buds combine punchy Pure Bass sound with active noise cancellation at an accessible price. With up to 48 hours of total battery and an IP54 rating, they are ready for the commute and the gym.', '[]'::jsonb, '8301435d-1089-578d-940c-b64471a44d4a', 'cd071265-a407-5543-9fa3-a1de03000d21', 8999, 10999, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('8caa728b-6bd2-579a-aaee-ee0a9dce5aa1', 'Anker PowerCore 20000mAh', 'anker-powercore-20000', 'ANK-PC20-30W', 'The Anker PowerCore 20000mAh is a dependable travel companion, delivering 30W USB-C Power Delivery to fast-charge phones and tablets. A dedicated trickle-charge mode keeps earbuds and small devices topped up safely.', '[]'::jsonb, '76358b6b-bdbf-5258-bbe5-dd60604de740', 'cead0973-cc7e-5f1d-bfe0-456224ee7a7e', 6499, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('8e252b4e-6b00-5f36-a5f9-d9f2de9a2290', 'Samsung 25W USB-C Charger', 'samsung-25w-charger', 'SAM-CHG-25W', 'The official Samsung 25W USB-C wall charger delivers Super Fast Charging for compatible Galaxy phones and works with any USB-C PD device. Its compact build makes it an easy everyday and travel charger.', '[]'::jsonb, 'c1a99b72-9133-5404-b6a3-5efe789bc868', 'cead0973-cc7e-5f1d-bfe0-456224ee7a7e', 2299, 2799, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('74fe4d3a-c077-5fcc-8d57-7ce86ae68a45', 'Spigen Rugged Armor Case (S24 Ultra)', 'spigen-rugged-armor-s24', 'SPG-RA-S24U', 'Spigen Rugged Armor wraps your Galaxy S24 Ultra in shock-absorbing TPU with Air Cushion corners and a grippy matte carbon finish. Raised bezels protect the screen and cameras from scratches and drops.', '[]'::jsonb, '5d15b193-8ded-5e20-ac7e-b452dadb786e', '4ac03dbd-99da-5379-b59a-fe82785ff4c7', 2999, NULL, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;
INSERT INTO public.products (id, name, slug, sku, description, specifications, brand_id, category_id, price, compare_at_price, is_active)
VALUES ('9f502b5e-3150-5a98-9ae1-b95ac7c1c1d9', 'Baseus 100W USB-C Cable (1m)', 'baseus-usb-c-cable-100w', 'BAS-USBC-100W', 'The Baseus 100W USB-C to USB-C cable supports fast charging for laptops and phones alike, wrapped in durable braided nylon. A tangle-free 1 metre length makes it a great daily driver at desk or on the go.', '[]'::jsonb, 'a7ed3124-524e-53aa-9fe3-910c3d6f5f72', 'e7b00b88-46d3-52e6-900c-414774b37c08', 1299, 1699, TRUE)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price, is_active = EXCLUDED.is_active;

-- -----------------------------------------------------------------------------
-- Product Media
-- -----------------------------------------------------------------------------
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('ced215f6-eddc-5177-88e1-48250d4af9c6', '7799298d-0114-588a-9be3-9f24cc17bd80', 'image', '/products/samsung-galaxy-s24-ultra.png', '/products/samsung-galaxy-s24-ultra.png', 'Samsung Galaxy S24 Ultra', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('11f7a64b-8e5f-5519-82b2-32ae96798727', '64df3fbb-95d5-558b-9dc5-ffc79a03b400', 'image', '/products/apple-iphone-15-pro.png', '/products/apple-iphone-15-pro.png', 'Apple iPhone 15 Pro', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('f49fdaa0-7106-53a5-bdc4-26d49f0fa123', '31e0bdc4-8f1d-5dca-b663-f5235d2baee4', 'image', '/products/xiaomi-redmi-note-13-pro.png', '/products/xiaomi-redmi-note-13-pro.png', 'Xiaomi Redmi Note 13 Pro', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('2714c7b8-672d-580d-b9e1-8c4f597b92c3', 'b9a5dc1c-01e9-551b-acce-e54608f54691', 'image', '/products/google-pixel-8.png', '/products/google-pixel-8.png', 'Google Pixel 8', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('0ef7cdd6-7828-57bc-8d0d-2b3acdd9576e', '937309e2-73af-52a9-a7da-f6adb90187bc', 'image', '/products/realme-12-pro-plus.png', '/products/realme-12-pro-plus.png', 'Realme 12 Pro+', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('8e78663e-6e0d-5acd-9e23-d0cc78b716a0', '9f33c92c-dade-51cb-ae8e-61466e1313ad', 'image', '/products/samsung-galaxy-a55.png', '/products/samsung-galaxy-a55.png', 'Samsung Galaxy A55 5G', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('61c7bc2b-8a37-5bb5-a10b-5f39dbf231c2', 'c2e160b4-0d30-5581-b6e5-3051b41d52e1', 'image', '/products/apple-airpods-pro-2.png', '/products/apple-airpods-pro-2.png', 'Apple AirPods Pro (2nd gen)', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('c0c521cf-847e-52cf-a848-22b4b520ffca', 'bb6a3075-deae-55bd-b474-882546faaaa2', 'image', '/products/jbl-tune-buds.png', '/products/jbl-tune-buds.png', 'JBL Tune Buds', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('db29a06c-979f-5362-bfa1-d6e29dd7591f', '8caa728b-6bd2-579a-aaee-ee0a9dce5aa1', 'image', '/products/anker-powercore-20000.png', '/products/anker-powercore-20000.png', 'Anker PowerCore 20000mAh', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('1563f813-a94e-59dc-96d6-eb0cdf11a0f3', '8e252b4e-6b00-5f36-a5f9-d9f2de9a2290', 'image', '/products/samsung-25w-charger.png', '/products/samsung-25w-charger.png', 'Samsung 25W USB-C Charger', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('ff7dfff7-d35c-5979-8eac-821884e16b18', '74fe4d3a-c077-5fcc-8d57-7ce86ae68a45', 'image', '/products/spigen-rugged-armor-s24.png', '/products/spigen-rugged-armor-s24.png', 'Spigen Rugged Armor Case (S24 Ultra)', 0, TRUE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.product_media (id, product_id, media_type, storage_path, public_url, alt_text, sort_order, is_primary)
VALUES ('c09cc2a7-24f6-5d2b-882f-edf538d25840', '9f502b5e-3150-5a98-9ae1-b95ac7c1c1d9', 'image', '/products/baseus-usb-c-cable-100w.png', '/products/baseus-usb-c-cable-100w.png', 'Baseus 100W USB-C Cable (1m)', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Inventory
-- -----------------------------------------------------------------------------
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('7799298d-0114-588a-9be3-9f24cc17bd80', 12, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('64df3fbb-95d5-558b-9dc5-ffc79a03b400', 8, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('31e0bdc4-8f1d-5dca-b663-f5235d2baee4', 40, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('b9a5dc1c-01e9-551b-acce-e54608f54691', 0, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('937309e2-73af-52a9-a7da-f6adb90187bc', 23, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('9f33c92c-dade-51cb-ae8e-61466e1313ad', 31, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('c2e160b4-0d30-5581-b6e5-3051b41d52e1', 27, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('bb6a3075-deae-55bd-b474-882546faaaa2', 54, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('8caa728b-6bd2-579a-aaee-ee0a9dce5aa1', 63, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('8e252b4e-6b00-5f36-a5f9-d9f2de9a2290', 88, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('74fe4d3a-c077-5fcc-8d57-7ce86ae68a45', 46, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;
INSERT INTO public.inventory (product_id, available_quantity, reserved_quantity, updated_at)
VALUES ('9f502b5e-3150-5a98-9ae1-b95ac7c1c1d9', 120, 0, NOW())
ON CONFLICT (product_id) DO UPDATE SET available_quantity = EXCLUDED.available_quantity;

-- -----------------------------------------------------------------------------
-- Inventory Transactions (Ledger audit)
-- -----------------------------------------------------------------------------
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('4dd77c4f-1547-563d-a12b-a4c256548219', '7799298d-0114-588a-9be3-9f24cc17bd80', 'initial_stock', 12, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('344314af-4429-5200-8cf1-882d19384645', '64df3fbb-95d5-558b-9dc5-ffc79a03b400', 'initial_stock', 8, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('ca9e85f1-94ee-5780-9f11-cd875e1932d8', '31e0bdc4-8f1d-5dca-b663-f5235d2baee4', 'initial_stock', 40, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('9e45a152-e729-5575-9648-9e576f77b310', '937309e2-73af-52a9-a7da-f6adb90187bc', 'initial_stock', 23, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('64f1bf16-a8e8-5493-a169-c3e0c7358b93', '9f33c92c-dade-51cb-ae8e-61466e1313ad', 'initial_stock', 31, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('2e9741b1-6de4-57b3-b29b-de4dd4c8503d', 'c2e160b4-0d30-5581-b6e5-3051b41d52e1', 'initial_stock', 27, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('e5d5f8f6-5348-534a-bd54-80c0592c72ad', 'bb6a3075-deae-55bd-b474-882546faaaa2', 'initial_stock', 54, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('849d3a3c-2006-593d-b07d-ed5772bccdff', '8caa728b-6bd2-579a-aaee-ee0a9dce5aa1', 'initial_stock', 63, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('c76950b1-867d-58d4-982f-7a5c5a57f6c6', '8e252b4e-6b00-5f36-a5f9-d9f2de9a2290', 'initial_stock', 88, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('3c30637d-e884-57a0-9c07-55728f21e561', '74fe4d3a-c077-5fcc-8d57-7ce86ae68a45', 'initial_stock', 46, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.inventory_transactions (id, product_id, transaction_type, quantity, reason, created_at)
VALUES ('49daff69-5d5f-5dd5-886d-b5428c41fa25', '9f502b5e-3150-5a98-9ae1-b95ac7c1c1d9', 'initial_stock', 120, 'Initial seed inventory', NOW())
ON CONFLICT (id) DO NOTHING;
