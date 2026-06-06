# Product Commercial Production Checklist

This document defines production readiness checks for Product / Pricing / Promotion / Inventory flows.

## 1. Product publish rules

A product can be visible on the storefront only when it meets all required readiness conditions:

- SKU exists.
- Product name exists.
- Category is assigned.
- Main image exists.
- Selling price is greater than 0.
- Stock is greater than 0, unless the product status is Pre-order or Coming soon.
- Product is active/published.

If a product is missing required data, it must remain Draft/Inactive and must not appear on `/shop` or product detail.

## 2. Price rules

- ProductPrice is the pricing history source.
- Current effective price is selected by active ProductPrice where startDate <= now and endDate is empty or >= now.
- Future scheduled prices must not apply before their startDate.
- Recompute effective prices must sync Product.price and Product.oldPrice from the current effective ProductPrice.
- Storefront listing, product detail, cart and checkout must use the backend commercial final price.

## 3. Promotion rules

- Promotion must apply to at least one product.
- Percent discount must be <= 100.
- Fixed discount must not exceed selling price.
- Promotion date range must be valid.
- When multiple promotions apply, commercial price resolver decides the active promotion by priority and discount rule.
- Sale badge/filter must be based on activePromotion, discountAmount, or finalPrice < basePrice, not manual product status.

## 4. Inventory rules

- In-stock product must have stock > 0 to be sellable.
- Pre-order / Coming soon products may have stock = 0 when allowed by business rules.
- Checkout must revalidate stock server-side.
- Product that becomes out of stock must not be sold as in-stock.

## 5. Storefront sellable rules

Storefront `/shop` and `/product/:slug` must not show products that are:

- inactive,
- draft,
- missing price,
- final price <= 0,
- missing stock for normal in-stock product.

## 6. Checkout price lock rules

- Checkout must never trust frontend price.
- Backend resolves final price at checkout time.
- OrderItem.price must equal the resolved final price at the time of order creation.
- If price changes after item is added to cart, checkout still uses the current backend final price.

## 7. Manual test checklist

### Product

1. Create product with price + stock + image + category -> publish is allowed.
2. Create product missing price -> Draft/Inactive, not visible on `/shop`.
3. Create product missing stock with status inStock -> Draft/Inactive, not visible on `/shop`.
4. Create product preorder with stock = 0 and price > 0 -> publish allowed when business allows preorder.
5. Unpublish product -> not visible on `/shop`.

### Pricing

6. Set current price -> `/admin/products`, `/shop`, and product detail show updated price.
7. Set future scheduled price -> price does not apply today.
8. Recompute effective prices -> Product.price is synced correctly.
9. Price history shows old/new price rows.

### Promotion

10. Create 10% percent discount -> detail/cart/checkout use final price.
11. Fixed discount greater than selling price -> blocked.
12. Product in two promotions -> priority/discount rule is applied correctly.

### Checkout

13. Add cart before price change, then checkout -> backend uses current final price.
14. Checkout out-of-stock product -> blocked.
15. OrderItem.price in DB equals final price at order time.
