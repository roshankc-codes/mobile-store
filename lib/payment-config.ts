/**
 * Shop Payment Configuration (Manual QR & Bank Transfer)
 *
 * NOTE FOR STORE OWNER / ADMINISTRATOR:
 * Replace the placeholder values below with your official business payment details
 * before going live in production.
 *
 * Requirements:
 * 1. Place your official payment QR code image in the `public/` directory
 *    (e.g., `public/store/payment-qr.png`).
 * 2. Update `qrCodeImageUrl` to point to that file (e.g., `"/store/payment-qr.png"`).
 * 3. Fill in your official beneficiary name, bank name, and account/mobile number.
 * 4. Set `isConfigured: true` once verified.
 */

export interface ShopPaymentConfig {
  /** Method display title */
  title: string
  /** Step-by-step instructions displayed to the customer */
  instructions: string
  /** Relative path or URL to the official QR code image (null if not yet provided) */
  qrCodeImageUrl: string | null
  /** Official registered account or merchant name (null if not yet provided) */
  accountName: string | null
  /** Bank name if direct account transfer is supported (null if not yet provided) */
  bankName: string | null
  /** Bank account number (null if not yet provided) */
  accountNumber: string | null
  /** Fonepay / eSewa / Khalti merchant ID or mobile number (null if not yet provided) */
  merchantId: string | null
  /** Flag indicating whether the store's real payment QR details are configured */
  isConfigured: boolean
}

export const shopPaymentConfig: ShopPaymentConfig = {
  title: "Scan & Pay via Mobile Banking / Fonepay / eSewa",
  instructions:
    "Scan the shop QR code using your mobile banking app or digital wallet (eSewa, Khalti, Fonepay). After completing payment, take a screenshot of the receipt and upload it below so our staff can verify your order.",
  // REAL STORE ASSET: Set to your uploaded QR image, e.g. "/store/payment-qr.png"
  qrCodeImageUrl: null,
  // REAL STORE DETAILS: To be provided by store owner
  accountName: null,
  bankName: null,
  accountNumber: null,
  merchantId: null,
  // Flip to true when real assets and account details have been filled in
  isConfigured: false,
}
