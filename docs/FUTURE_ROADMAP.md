# ShopAI — Future Architecture / Roadmap

## Current (implemented scope)

- Core e-commerce (catalog, cart, wishlist, orders, reviews, auth, admin basics)
- **Phase 2:** AI natural-language search (LLM intent → validated SQL filters + semantic ranking)

## Planned next

- Phase 3: RAG product assistant on product pages
- Phase 4: AI review intelligence
- Phase 5: Comparison + recommendations
- Phase 6: Shopping assistant with tool calling

## Future (not in current version)

- Admin AI intelligence (sales/inventory insights)
- AI inventory prediction
- Custom ML recommendation models / fine-tuning
- Redis / distributed caching
- AI evaluation pipeline (RAG accuracy, hallucination metrics)
- Real payment integration (Stripe, etc.)
- Microservices / Kubernetes

The modular monolith (`Next.js → Express API → PostgreSQL`) is intentional for this portfolio project.
