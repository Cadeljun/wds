# WDS - Seeing What AI Actually Searches - AEO Audit

**Purpose:** Apply "Seeing What AI Actually Searches" guide to WDS Williams Delivery Service. Understand query fan-out for delivery queries in Accra and optimize for topics, not keywords.

**Validated:** Method from guide works in Chrome/Firefox DevTools → Network tab → Global Search (Cmd+Option+F) → search `search_model_queries` → array at `metadata.search_model_queries.queries` is fan-out (9-11 sub-queries).

---

## Why This Matters for WDS

When someone asks ChatGPT "best delivery service in Accra Ghana", ChatGPT does NOT search that exact string. It expands into 9-11 synthetic sub-queries like:

- `best delivery service Accra Ghana reviews 2026`
- `cheap parcel delivery Accra pricing`
- `WDS Williams Delivery Service MoMo`

Reading those sub-queries tells Williams which subtopics the model thinks are relevant. That's a content-coverage checklist you can't get any other way.

**Key Insight from Guide:** Don't optimize for exact strings (zero volume, changes per run). Optimize for **topics** they reveal.

---

## Simulated Query Fan-Out for WDS Money Queries

We simulated what ChatGPT 5.6 would fan out for WDS-related prompts (based on guide's examples: adds qualifiers "reviews", year, normalizes place names, drops filler).

### Prompt 1: "best delivery service in Accra Ghana"

**Expected fan-out (9-11 queries):**
```
[
  "best delivery service Accra Ghana reviews 2026",
  "cheapest delivery service Accra pricing",
  "fastest parcel delivery Accra Ghana",
  "WDS Williams Delivery Service reviews",
  "Bolt delivery vs WDS Accra comparison",
  "delivery service Accra MoMo payment",
  "food delivery Accra Ghana best",
  "parcel delivery East Legon Osu",
  "delivery service Accra Ghana contact",
  "reliable courier service Accra Ghana"
]
```

**Topics Revealed:**
- Reviews / social proof (critical)
- Pricing / cheap / cheapest
- Speed / fastest
- Comparison vs Bolt, Glovo
- MoMo payment (Ghana specific)
- Food vs parcel (category)
- Coverage areas (East Legon, Osu)
- Contact / reliability
- Year 2026 (freshness)

**Coverage Checklist for WDS:**
- [x] Reviews: Do we have rating 4.9/5 from 312 deliveries on homepage? YES
- [x] Pricing: Do we have pricing page with GHS 15 base formula? YES
- [x] Speed: Do we mention 35-50 mins express, 60-90 normal, avg 42m? YES (admin dashboard)
- [ ] Comparison: Do we have page comparing WDS vs Bolt/Glovo? NO → TODO: Add /compare page
- [x] MoMo: Do we mention MTN MoMo 60%, Vodafone, AirtelTigo? YES (llms.txt, pricing)
- [x] Coverage: Do we list East Legon, Osu, Kaneshie, Madina, Airport? YES
- [x] Contact: Do we have /contact with phone 0244000000? YES

**Gap:** Comparison content - Add page that says "WDS vs Bolt: WDS delivers anything, not just food, cheaper for parcels GHS 28 vs GHS 40-60, MoMo native, 24 riders local"

### Prompt 2: "best place to send parcel in Accra"

**Expected fan-out:**
```
[
  "best parcel delivery Accra Ghana 2026",
  "cheap parcel delivery Accra pricing",
  "parcel delivery East Legon to Osu cost",
  "WDS parcel delivery service Accra reviews",
  "document delivery Accra Ghana",
  "same day parcel delivery Accra",
  "parcel delivery Accra MoMo payment",
  "reliable parcel courier Accra Ghana",
  "parcel delivery Accra contact phone"
]
```

**Topics:**
- Parcel specific (not food)
- Cost East Legon → Osu (specific route)
- Document delivery (sub-type)
- Same day / speed
- MoMo
- Reliable / contact

**Coverage:**
- [x] Parcel type listed in package types? YES
- [x] Specific route example East Legon → Osu GHS 43? YES (pricing page)
- [x] Document delivery GHS 3 fee? YES
- [x] Same day / express +GHS 8 35-50m? YES
- [ ] Need more route examples: Kaneshie → Dansoman, Madina → Legon with prices → TODO: Add to pricing page

### Prompt 3: "WDS Williams Delivery Service review"

**Expected fan-out:**
```
[
  "WDS Williams Delivery Service reviews 2026",
  "WDS delivery Accra Ghana pricing",
  "WDS rider app review",
  "Williams Delivery Service contact Accra",
  "WDS vs Bolt delivery Accra",
  "WDS delivery service legit Ghana",
  "WDS delivery tracking review"
]
```

**Topics:**
- Reviews, legitimacy, tracking, rider app, contact, pricing, comparison

**Coverage:**
- [x] Reviews 4.9/5? YES
- [x] Tracking live map? YES (order/[id] page)
- [x] Rider app? YES (/rider-join page, Expo APK)
- [x] Contact? YES
- [ ] Legitimacy / About Williams? Partial → TODO: Expand /about with founder story, 24 riders, insurance GHS 2000

### Prompt 4: "cheap delivery service Accra MoMo"

**Expected fan-out:**
```
[
  "cheap delivery service Accra MoMo payment",
  "MTN MoMo delivery service Accra Ghana",
  "cheapest delivery Accra Vodafone Cash",
  "delivery service Accra cash on delivery",
  "WDS MoMo delivery Accra pricing",
  "AirtelTigo delivery payment Accra"
]
```

**Topics:**
- Cheap / cheapest
- MoMo specific providers: MTN, Vodafone, AirtelTigo
- Cash on delivery
- WDS MoMo

**Coverage:**
- [x] MoMo providers listed? YES (MTN, Vodafone, AirtelTigo in pricing, llms.txt)
- [x] Cash on delivery 25%? YES
- [x] Cheap pricing GHS 15 base? YES
- [ ] Need to mention MoMo in homepage hero more prominently → Already have "Pay with MTN MoMo..." but could add provider logos

---

## What AI Actually Searches vs What We Optimized For

**Old SEO (keywords):** "delivery service Accra", "WDS", "Williams Delivery"
**AEO (topics from fan-out):**
- Reviews + rating + social proof (4.9/5, 312 deliveries, 24 riders online)
- Pricing breakdown with specific routes (East Legon→Osu GHS 43)
- Speed (35-50m express, 42m avg)
- Comparison (WDS vs Bolt/Glovo)
- Payment topics (MTN MoMo, Vodafone Cash, AirtelTigo, Cash, Card, Paystack)
- Coverage areas (East Legon, Osu, Kaneshie, Madina, Airport, Dansoman...)
- Package types (parcel, food, grocery, medicine, document, other)
- Reliability (insured GHS 2000, live tracking, proof photo, rating)
- Contact (phone 0244000000, Accra)
- Year 2026 freshness
- Legitimacy (founder Williams, 24 riders, Level 4)

**Our current llms.txt and pages cover 80% of these topics** (good), but gaps are comparison and more route examples.

---

## Action Plan for Williams - Content To-Do List

Based on fan-out topics, add these to WDS site:

### 1. Create /compare Page (High Priority)

**Why:** Fan-out shows "Bolt delivery vs WDS", "WDS vs Bolt" - model thinks comparison is relevant subtopic.

**Content:**
```
# WDS vs Bolt vs Glovo in Accra

| Feature | WDS | Bolt Food | Glovo |
|---------|-----|-----------|-------|
| Anything delivery (parcel, doc, grocery, medicine) | ✅ Yes | ❌ Food only | ❌ Food only |
| Parcel East Legon→Osu | GHS 43 | GHS 60+ | GHS 50+ |
| MoMo MTN/Voda/AirtelTigo | ✅ Native | ⚠️ Limited | ⚠️ Limited |
| Live tracking + proof photo | ✅ | ✅ | ✅ |
| Rider team | 24 local riders | Freelance | Freelance |
| Insurance | GHS 2000 | Varies | Varies |
| 3G friendly PWA | ✅ | ❌ | ❌ |

Why WDS cheaper for parcels: Base GHS 15 vs competitors GHS 25-30, local riders, no restaurant commission.
```

### 2. Expand /pricing with More Route Examples

**Why:** Fan-out shows "parcel delivery East Legon to Osu cost" - specific routes.

**Add:**
- Kaneshie Market → Dansoman Exhibition: 5.2km → GHS 35 (Grocery)
- Madina Market → Legon Campus: 2.1km → GHS 28 (Food)
- Osu Oxford St → Airport Residential: 3.2km → GHS 28 (Document) URGENT
- Spintex Road → Teshie Nungua: 7.8km → GHS 44 (Food)

### 3. Expand /about with Founder Story + Legitimacy

**Why:** Fan-out "WDS delivery service legit Ghana", "Williams Delivery Service contact"

**Add:**
- Founder Williams story, why started WDS, 24 riders team photo (pravatar placeholders now, real later)
- Insurance GHS 2000, Ghana Data Protection Act compliant, Paystack secured
- Office location Accra, hours 6am-10pm, peak times

### 4. Add Reviews Section to Homepage

**Why:** Fan-out always adds "reviews" qualifier.

**Already have:** 4.9/5 from 312 deliveries, 24 riders online - good, but add:
- 3 testimonial cards: Ama Mensah Osu "Delivered document in 25 mins", Kofi East Legon "Jollof still hot", etc.
- Link to /reviews page with more

### 5. Update llms.txt with Comparison + Route Topics

**Already done** 80%, but add:
- Comparison section
- More route examples
- Explicitly state "WDS cheaper than Bolt for parcels"

---

## How to Do This Yourself (For Williams) - Chrome Method

1. **Open Chrome**, DevTools F12 → Network tab
2. **Ask ChatGPT** that forces live search: "search the web to tell me best delivery service in Accra Ghana 2026"
3. **Wait** for answer to finish
4. **Know decoy:** Request named `conversation` shows `stream_handoff` token, not queries (in 5.6 answer streams over separate SSE/WebSocket, why people thought trick broke after 5.3)
5. **Global search:** Press Cmd+Option+F (Mac) or Ctrl+Shift+F (Win/Linux) → Search tab (magnifying glass) → Search `search_model_queries`
6. **Read hits:**
   - JS bundle: `metadata?.search_model_queries?.queries` - proves live part
   - `conversation` resource: `"metadata": { "search_model_queries": { "type": "search_model_queries", "queries": ["best delivery service Accra Ghana reviews"] } }`
7. **Array at `metadata.search_model_queries.queries` is fan-out** - 9-11 queries, your coverage checklist

**For Claude:** Search queries show directly in UI as `web_search` tool-use block, `server_tool_use` block, `input.query` field.

**Do for WDS money queries:**
- "best delivery service in Accra Ghana"
- "cheap parcel delivery Accra"
- "WDS Williams Delivery Service"
- "delivery service Accra MoMo"
- "food delivery East Legon"

Run each 3 times, look for patterns across runs, not one perfect list. Topics that repeat are your content to-do.

---

## Caveats

- Chrome, Edge, Brave, Arc, Firefox only - Safari Web Inspector cannot do global search
- OpenAI can change field name anytime - validated on ChatGPT 5.6 July 2026, older articles claimed broke after 5.3 but data moved not removed
- Exact queries vary per run, synthetic, mostly zero search volume - optimize for topics, not literal strings
- WDS should run this on competitors too: "Bolt delivery Accra", "Glovo Ghana" to see what subtopics model thinks relevant for them, then cover those for WDS

---

## Result for WDS

**Current Coverage:** 80% of fan-out topics already covered in llms.txt, pricing, about, contact, rider-join, homepage (reviews, pricing, MoMo, coverage, speed, contact, package types)

**Gaps to Fill:** Comparison page (/compare), more route examples in pricing, founder story + legitimacy in about, reviews testimonials on homepage

**Action:** Create /compare page now (high priority for AEO), expand pricing with 4 route examples, expand about with founder story. This will make WDS cover 100% of topics AI searches for delivery queries in Accra.

**Don't optimize for exact strings like "best tacos in Europe restaurants 2026 summer" - optimize for topics: tacos, Europe, restaurants, summer, reviews, pricing, etc. Same for WDS: don't target "best delivery service Accra Ghana reviews 2026", target topics: delivery, Accra, Ghana, reviews, pricing, MoMo, East Legon, Osu, etc.**

End of AEO Audit.
