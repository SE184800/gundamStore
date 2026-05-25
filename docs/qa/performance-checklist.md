# Performance QA Checklist - Gundam Store VN

## Build
Run npm run build and confirm build passes.

## Route smoke test
Test these routes after build/dev:
- /
- /shop
- /product/<slug>
- /cart
- /checkout
- /news/events
- /admin
- /admin/orders
- /admin/qa-helper

## DevTools Network
Open Chrome DevTools > Network:
- First load should not download all admin page chunks immediately.
- Opening /admin should download admin chunk.
- Opening /news/events should download map/leaflet chunk.

## Lighthouse quick target
Mobile:
- Performance should improve compared with previous build.
- Best Practices should not have major new warnings.
- SEO public pages should have title and description.
