# ⚠️ Not the source of truth

This `backend/` folder is a **stale snapshot**, not the real backend.

The real backend is a separate repo — `tatm0967005-art/gundam-store-team` (`backend/`) — deployed to Render at `gundam-store-backend-uat`. This copy has diverged from it (missing recent features such as generic media/video upload, and it carries a leftover in-memory cache hack in `productController.js` that was never part of the real backend).

**Do not:**

- Run `npm run dev`, `npm run check`, `npm run seed*`, or any `prisma` command from here expecting it to affect the deployed API or the real database.
- Treat this code as a reference for how the live backend currently behaves.

To work on the backend, use `tatm0967005-art/gundam-store-team` instead.

See the root `README.md` of this repo for more context.
