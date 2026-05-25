# SEO QA Checklist - Gundam Store VN

## Pages to test
- /
- /shop
- /product/<slug>
- /pre-order
- /promotions
- /flash-sale
- /restock
- /limited
- /coming-soon
- /news
- /news/<slug>
- /news/events
- /news/events/<id>
- /community-gallery

## Browser checks
Open DevTools Console:

```js
document.title
document.querySelector('meta[name="description"]')?.content
document.querySelector('link[rel="canonical"]')?.href
document.querySelector('meta[name="robots"]')?.content
[...document.querySelectorAll('script[type="application/ld+json"]')].map(x => JSON.parse(x.textContent))
