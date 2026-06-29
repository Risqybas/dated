# Dated — PI Project Brief
> Grand theme: Membangun Aplikasi Social-Fashion 'DATED' Berbasis Progressive Web App (PWA) Menggunakan React.js dan Tailwind dengan Metode Scrum dengan Integrasi Supabase 
> Build target: 1-2 weeks | Format: Progressive Web App (PWA) | Stack: React + Supabase + Gemini AI + remove.bg

---

## 1. Product Overview

**Dated** is a fashion social media app focused on authenticity and lifestyle memory management. It uses a real-time capture system to ensure that today's photos are genuine outfits, which are then automatically archived into the user's calendar grid. BeReal inspirated apps

**Core philosophy:** Simple UI, great UX. Dynamic calendar grid archive. Dark mode support. Aunthentic camera. Daily feed. No app store installation required (PWA).

---

## 2. Problems We Solve

### 2.1 Social & Personal Identity — Inauthenticity

**Problem 1: High-curation pressure and "Perfection" culture**
- Mainstream social media platforms (like Instagram) enforce hyper-aesthetic standards.
- Users only capture "perfect" moments, causing honest, raw documentation of daily style to disappear due to social pressure.
- Business/Social Impact: Loss of authentic self-expression and a decline in the function of fashion as a tool for genuine personal reflection.

### 2.2 Data Management — Information Overload
**Problem 2: Unstructured visual data in mobile galleries**
- "Outfit of the Day" (OOTD) photos are often buried under thousands of unrelated files, such as screenshots, memes, and work documents.
- There is no specific chronological tracking or dedicated system to archive clothing history.
- Impact: Significant decision fatigue; users struggle to recall previous outfit combinations, leading to repetitive styling or unnecessary purchases.

### 2.3 Sustainability — Over-consumption & Waste
**Problem 3: The "Wear-it-once" stigma**
- Social media creates a psychological barrier against repeating outfits, fueling a "once-and-done" mindset.
- Lack of visibility into one's own wardrobe leads to the "out of sight, out of mind" phenomenon.
- Impact: Direct contribution to the Fast Fashion crisis and a constant feeling of "having nothing to wear" despite a full closet.

**Problem 4: Low wardrobe utilization and optimization**
- Without a log of past pairings, users tend to buy new items rather than re-styling or mixing existing pieces.
- No data-driven insight exists to help users realize the maximum potential of their current collection.

---

## 3. Our Solution — Feature List

| Feature | Segment | Description |
|---|---|---|
| Daily Capture (BeReal-style) | Core Social | Timed notification prompts users to capture authentic OOTD within 2-min window; timestamps embedded for proof of authenticity |
| Smart Calendar Grid Archive | Data Management | Auto-organize captured outfits into interactive calendar view; swipe through past looks by date, month, or year |
| Outfit Metadata Tagging | Styling & Discovery | Auto-tag clothing items using Gemini AI vision (brand, color, category, occasion); users can manually add notes (e.g., "Event: Birthday party") |
| Background Removal & Auto-Polish | Photo Enhancement | One-tap remove.bg integration to isolate outfit from background; auto-enhance lighting and contrast for consistency |
| Outfit Repeat Counter | Sustainability Insight | Track how many times each outfit has been worn; celebrate "repeat wins" to normalize rewearing and shift mindset away from "once-and-done" |
| Daily Feed (Chronological) | Social Discovery | Real-time feed of friends' daily captures; like, comment, react; chronological-only (no algorithm) to prioritize authenticity |
| Wardrobe Utilization Score | Analytics & Sustainability | Gemini AI analyzes outfit patterns; shows which items are worn frequently vs. dormant; suggests new pairings from existing pieces |
| Outfit Pairing Recommendations | Styling Assistant | AI suggests outfit combinations based on past captures, seasonal trends, and user preferences to maximize wardrobe potential |
| Friend Circle & Private Sharing | Social & Privacy | Share daily captures with selected friends only; opt-in social, not broadcast; build intimate style communities |
| Dark Mode & Lightweight UI | User Experience | Minimal, clean interface; dark mode for eye comfort; fully offline-capable with sync when online (PWA advantage) |
| Installable PWA (No App Store) | Accessibility | Add to home screen on any device; works offline; push notifications for daily capture reminders |
| AI Fashion Insights (Weekly Digest) | Engagement | Weekly summary: most-worn colors, favorite brands, style evolution, sustainability impact (e.g., "You rewore 8 outfits this week!") |

---

## 4. Tech Stack

### Frontend
- **React 18** with **Vite** — fast setup, hot reload, optimized for PWA build
- **Tailwind CSS** — mobile-first utility classes, dark mode support out-of-the-box
- **Lucide React** — For consistent, lightweight iconography.
- **Recharts** — visualize wardrobe utilization trends, outfit wear frequency charts, style analytics

### PWA & Offline-First
- **vite-plugin-pwa** — make app installable on home screen; works without app store
- **Workbox** (via vite-plugin-pwa) — intelligent caching for calendar grid, past captures, and metadata

### Backend & Database
- **PostgreSQL Database** — Relational storage for user profiles, outfit metadata, and social interactions.
- **Supabase Auth** — Handles secure Authentication via Email, Google, or Magic Links.
- **Supabase Storage** — High-performance bucket storage for raw and processed (background-removed) outfit photos.
- **Supabase Realtime** — Enables instant "Like" and "Comment" updates in the Daily Feed.
- **Edge Functions** — Serverless logic to handle API secret management for Gemini and remove.bg.

### AI & Computer Vision
 **Google Gemini API (via Google AI Studio)**
- Vision (Multimodal): Automatically extracts metadata (clothing type, color, material, style) from captured photos.
- Natural Language: Generates the "Weekly Fashion Digest" and provides AI styling recommendations based on the existing wardrobe.

- **remove.bg API** - Integrated via Supabase Edge Functions to isolate outfits from the background for a clean "Studio Look" in the calendar grid.

### Push Notifications
- **Supabase Edge Functions + Web Push API** — Custom logic triggered by database webhooks (cron jobs) to send daily "Capture Time" notifications to users' devices.

### Deployment & Hosting
- **Vercel** — Primary hosting provider.
- CI/CD: Automatic deployment from the GitHub main branch.
- Environment Variables: Securely store Supabase keys and Gemini API credentials.

---

## 5. SQL Schema (Supabase / PostgreSQL)

```sql
-- ============================================================
-- DATED APP — Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  is_private    BOOLEAN DEFAULT false,
  push_token    TEXT,                        -- Web Push subscription JSON
  notify_time   TIME DEFAULT '08:00:00',     -- Daily capture notification time
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OUTFITS (Core entity — one per daily capture)
-- ============================================================
CREATE TABLE public.outfits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  captured_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- Actual capture timestamp (authenticity proof)
  capture_date        DATE GENERATED ALWAYS AS (CAST(captured_at AT TIME ZONE 'UTC' AS DATE)) STORED,  -- For calendar grid queries  -- For calendar grid queries
  raw_image_url       TEXT NOT NULL,                       -- Supabase Storage: raw photo
  processed_image_url TEXT,                                -- Supabase Storage: bg-removed photo
  is_bg_removed       BOOLEAN DEFAULT false,
  visibility          TEXT DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
  caption             TEXT,
  location_label      TEXT,                                -- Optional freetext location
  wear_count          INT DEFAULT 1,                       -- Incremented on outfit re-logs
  is_deleted          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outfits_user_date ON public.outfits(user_id, capture_date DESC);
CREATE INDEX idx_outfits_capture_date ON public.outfits(capture_date DESC);

-- ============================================================
-- OUTFIT METADATA TAGS (Gemini AI-generated + manual)
-- ============================================================
CREATE TABLE public.outfit_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id   UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  tag_type    TEXT NOT NULL CHECK (tag_type IN ('category', 'color', 'brand', 'occasion', 'material', 'style', 'manual')),
  tag_value   TEXT NOT NULL,
  confidence  FLOAT,                        -- Gemini confidence score (0.0–1.0); NULL for manual tags
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outfit_tags_outfit ON public.outfit_tags(outfit_id);
CREATE INDEX idx_outfit_tags_type_value ON public.outfit_tags(tag_type, tag_value);

-- ============================================================
-- WARDROBE ITEMS (Parsed clothing items from outfits)
-- ============================================================
CREATE TABLE public.wardrobe_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,            -- e.g. "White Oversized Shirt"
  category        TEXT,                     -- e.g. tops, bottoms, shoes, accessories
  brand           TEXT,
  color           TEXT,
  thumbnail_url   TEXT,                     -- Cropped image of item (optional)
  times_worn      INT DEFAULT 0,
  last_worn_at    DATE,
  is_active       BOOLEAN DEFAULT true,     -- false = donated/sold
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wardrobe_user ON public.wardrobe_items(user_id);

-- ============================================================
-- OUTFIT ↔ WARDROBE ITEM JUNCTION
-- ============================================================
CREATE TABLE public.outfit_wardrobe_items (
  outfit_id        UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  wardrobe_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  PRIMARY KEY (outfit_id, wardrobe_item_id)
);

-- ============================================================
-- SOCIAL — FOLLOWS
-- ============================================================
CREATE TABLE public.follows (
  follower_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),  -- pending for private accounts
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_following ON public.follows(following_id);

-- ============================================================
-- SOCIAL — LIKES
-- ============================================================
CREATE TABLE public.likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id  UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (outfit_id, user_id)
);

CREATE INDEX idx_likes_outfit ON public.likes(outfit_id);

-- ============================================================
-- SOCIAL — COMMENTS
-- ============================================================
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id   UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.comments(id) ON DELETE CASCADE,  -- For threaded replies
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_outfit ON public.comments(outfit_id);

-- ============================================================
-- SOCIAL — REACTIONS (emoji reactions on outfits)
-- ============================================================
CREATE TABLE public.reactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id  UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,               -- e.g. "🔥", "✨", "💅"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (outfit_id, user_id, emoji)
);

-- ============================================================
-- AI FASHION INSIGHTS — Weekly Digests
-- ============================================================
CREATE TABLE public.weekly_digests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start       DATE NOT NULL,
  week_end         DATE NOT NULL,
  outfits_count    INT DEFAULT 0,
  reused_count     INT DEFAULT 0,
  top_colors       JSONB,                 -- e.g. ["black", "white", "beige"]
  top_brands       JSONB,
  top_categories   JSONB,
  sustainability_score  FLOAT,           -- 0–100, higher = more rewearing
  ai_summary       TEXT,                 -- Gemini-generated narrative digest
  ai_recommendations JSONB,             -- Outfit pairing suggestions
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ============================================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh_key   TEXT NOT NULL,
  auth_key     TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY CAPTURE WINDOW LOG (Authenticity audit trail)
-- ============================================================
CREATE TABLE public.capture_windows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  window_date  DATE NOT NULL,
  opened_at    TIMESTAMPTZ,              -- When the 2-min window was triggered
  captured_at  TIMESTAMPTZ,             -- When photo was taken (must be within window)
  outfit_id    UUID REFERENCES public.outfits(id),
  missed       BOOLEAN DEFAULT false,
  UNIQUE (user_id, window_date)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_digests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_windows    ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can write
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Outfits: respect visibility settings
CREATE POLICY "Users can manage their own outfits" ON public.outfits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Friends can see friends outfits" ON public.outfits
  FOR SELECT USING (
    visibility = 'public'
    OR auth.uid() = user_id
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid()
          AND following_id = outfits.user_id
          AND status = 'accepted'
      )
    )
  );

-- Wardrobe: private to owner
CREATE POLICY "Wardrobe items are private to owner" ON public.wardrobe_items
  FOR ALL USING (auth.uid() = user_id);

-- Likes, Comments, Reactions: authenticated users
CREATE POLICY "Authenticated users can like" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can see all likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can delete own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can update/delete own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Weekly digests: private to owner
CREATE POLICY "Digests are private to owner" ON public.weekly_digests
  FOR ALL USING (auth.uid() = user_id);

-- Push subscriptions: private to owner
CREATE POLICY "Push subscriptions are private to owner" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-increment wear_count on wardrobe item when linked to a new outfit
CREATE OR REPLACE FUNCTION public.increment_wear_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.wardrobe_items
  SET times_worn = times_worn + 1,
      last_worn_at = NOW()::DATE
  WHERE id = NEW.wardrobe_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_outfit_item_linked
  AFTER INSERT ON public.outfit_wardrobe_items
  FOR EACH ROW EXECUTE FUNCTION public.increment_wear_count();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at   BEFORE UPDATE ON public.profiles   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_outfits_updated_at    BEFORE UPDATE ON public.outfits    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_wardrobe_updated_at   BEFORE UPDATE ON public.wardrobe_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```
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
---

## 6. App Pages / Routes

```
/                        → Landing / Onboarding (unauthenticated)
/login                   → Auth page (Email / Google / Magic Link)
/register                → Sign up
/feed                    → Daily Feed (Home — chronological friends feed)
/capture                 → Daily Capture (BeReal-style camera trigger)
/calendar                → Smart Calendar Grid Archive (personal)
/calendar/:date          → Single-day outfit detail
/profile                 → Own profile page
/profile/:username       → Public/friend profile page
/wardrobe                → Wardrobe manager (items list + stats)
/wardrobe/insights       → Wardrobe Utilization Score + AI recommendations
/digest                  → Weekly AI Fashion Digest
/outfit/:id              → Single outfit detail (likes, comments, reactions)
/settings                → Account settings, notification time, privacy
/settings/notifications  → Push notification subscription management
/search                  → Find friends by username
```

---

## 7. AI Integration — Gemini API

### 7.1 Architecture Overview

All Gemini and remove.bg calls are made **server-side** via **Supabase Edge Functions** — never from the client — to protect API keys.

```
Client (React PWA)
    │
    ▼
Supabase Edge Functions (Deno)
    ├── /functions/analyze-outfit   → Gemini Vision API
    ├── /functions/remove-bg        → remove.bg API
    ├── /functions/weekly-digest    → Gemini Text API (cron)
    └── /functions/push-notify      → Web Push API (cron)
```

---

### 7.2 Edge Function: `analyze-outfit`

**Trigger:** Called by the client immediately after a photo is uploaded to Supabase Storage.

**Purpose:** Extract outfit metadata tags using Gemini's multimodal vision.

```typescript
// supabase/functions/analyze-outfit/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = "gemini-1.5-flash";

serve(async (req) => {
  const { outfit_id, image_url } = await req.json();

  // 1. Fetch image and convert to base64
  const imageRes = await fetch(image_url);
  const imageBuffer = await imageRes.arrayBuffer();
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

  // 2. Call Gemini Vision
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this outfit photo and return a JSON object with the following structure:
{
  "items": [
    {
      "name": "descriptive name of the clothing item",
      "category": "tops|bottoms|dress|outerwear|shoes|accessories|bag",
      "color": "primary color",
      "brand": "detected brand or null",
      "material": "detected material or null",
      "style": "casual|formal|streetwear|sporty|vintage|minimalist|bohemian"
    }
  ],
  "overall_style": "overall outfit style description",
  "occasion": "everyday|work|party|date|sport|travel|formal",
  "color_palette": ["color1", "color2"],
  "season": "spring|summer|autumn|winter|all-season"
}
Return ONLY valid JSON, no markdown.`
            },
            {
              inline_data: { mime_type: mimeType, data: base64Image }
            }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    }
  );

  const geminiData = await geminiRes.json();
  const rawText = geminiData.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());

  // 3. Store tags in Supabase
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const tags = [];
  for (const item of parsed.items) {
    if (item.category) tags.push({ outfit_id, tag_type: "category", tag_value: item.category, confidence: 0.9 });
    if (item.color)    tags.push({ outfit_id, tag_type: "color",    tag_value: item.color,    confidence: 0.85 });
    if (item.brand)    tags.push({ outfit_id, tag_type: "brand",    tag_value: item.brand,    confidence: 0.75 });
    if (item.material) tags.push({ outfit_id, tag_type: "material", tag_value: item.material, confidence: 0.7 });
    if (item.style)    tags.push({ outfit_id, tag_type: "style",    tag_value: item.style,    confidence: 0.8 });
  }
  if (parsed.occasion) tags.push({ outfit_id, tag_type: "occasion", tag_value: parsed.occasion, confidence: 0.85 });

  await supabase.from("outfit_tags").insert(tags);

  return new Response(JSON.stringify({ success: true, tags, parsed }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### 7.3 Edge Function: `remove-bg`

**Trigger:** Called client-side after capture, or on-demand from outfit detail.

```typescript
// supabase/functions/remove-bg/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { outfit_id, raw_image_url, user_id } = await req.json();

  // 1. Fetch original image
  const imageRes = await fetch(raw_image_url);
  const imageBlob = await imageRes.blob();

  // 2. Call remove.bg
  const formData = new FormData();
  formData.append("image_file", imageBlob, "outfit.jpg");
  formData.append("size", "auto");

  const bgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": Deno.env.get("REMOVE_BG_API_KEY")! },
    body: formData,
  });

  if (!bgRes.ok) {
    return new Response(JSON.stringify({ error: "remove.bg failed" }), { status: 500 });
  }

  const processedBuffer = await bgRes.arrayBuffer();

  // 3. Upload processed image to Supabase Storage
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const fileName = `processed/${user_id}/${outfit_id}.png`;
  const { data: uploadData } = await supabase.storage
    .from("outfits")
    .upload(fileName, processedBuffer, { contentType: "image/png", upsert: true });

  const { data: { publicUrl } } = supabase.storage.from("outfits").getPublicUrl(fileName);

  // 4. Update outfit record
  await supabase
    .from("outfits")
    .update({ processed_image_url: publicUrl, is_bg_removed: true })
    .eq("id", outfit_id);

  return new Response(JSON.stringify({ success: true, processed_image_url: publicUrl }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

### 7.4 Edge Function: `weekly-digest` (Cron)

**Trigger:** Supabase cron job — every Monday at 09:00 local time.

```typescript
// supabase/functions/weekly-digest/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() - 1);
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 6);

  const { data: users } = await supabase.from("profiles").select("id");

  for (const user of users ?? []) {
    // Fetch outfits for the week
    const { data: outfits } = await supabase
      .from("outfits")
      .select("id, wear_count, outfit_tags(*)")
      .eq("user_id", user.id)
      .gte("capture_date", weekStart.toISOString().split("T")[0])
      .lte("capture_date", weekEnd.toISOString().split("T")[0]);

    if (!outfits || outfits.length === 0) continue;

    const reused = outfits.filter(o => o.wear_count > 1).length;
    const allTags = outfits.flatMap(o => o.outfit_tags);
    const colorTags = allTags.filter(t => t.tag_type === "color").map(t => t.tag_value);
    const topColors = [...new Set(colorTags)].slice(0, 3);

    // Build Gemini prompt
    const prompt = `You are a friendly AI fashion coach. Based on this user's weekly outfit data, write a short, encouraging 2-3 sentence digest summary and 2 outfit pairing tips.

Weekly stats:
- Outfits captured: ${outfits.length}
- Outfits reworn: ${reused}
- Top colors worn: ${topColors.join(", ")}

Return JSON:
{
  "summary": "Your encouraging weekly narrative here",
  "recommendations": ["Tip 1", "Tip 2"],
  "sustainability_score": <number 0-100>
}
Return ONLY valid JSON.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates[0].content.parts[0].text;
    const aiResult = JSON.parse(rawText.replace(/```json|```/g, "").trim());

    await supabase.from("weekly_digests").upsert({
      user_id: user.id,
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      outfits_count: outfits.length,
      reused_count: reused,
      top_colors: topColors,
      sustainability_score: aiResult.sustainability_score,
      ai_summary: aiResult.summary,
      ai_recommendations: aiResult.recommendations,
    }, { onConflict: "user_id,week_start" });
  }

  return new Response("Weekly digests generated", { status: 200 });
});
```

---

### 7.5 Edge Function: `push-notify` (Cron)

**Trigger:** Supabase cron job — daily at the user's configured `notify_time`.

```typescript
// supabase/functions/push-notify/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

serve(async () => {
  webpush.setVapidDetails(
    "mailto:support@dated.app",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!
  );

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*, profiles(notify_time)");

  const currentHour = new Date().getUTCHours();

  for (const sub of subs ?? []) {
    const notifyHour = parseInt(sub.profiles?.notify_time?.split(":")[0] ?? "8");
    if (notifyHour !== currentHour) continue;

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        JSON.stringify({
          title: "✨ Time to DATED!",
          body: "Capture your outfit of the day — you have 2 minutes!",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          data: { url: "/capture" }
        })
      );
    } catch (err) {
      console.error(`Push failed for sub ${sub.id}:`, err);
    }
  }

  return new Response("Notifications sent", { status: 200 });
});
```

---

## 8. Project Structure

```
dated/
├── public/
│   ├── icons/                        # PWA icons (72, 96, 128, 144, 152, 192, 384, 512px)
│   ├── screenshots/                  # PWA install screenshots
│   └── manifest.json                 # (auto-generated by vite-plugin-pwa)
│
├── src/
│   ├── main.jsx                      # React entry point + registerSW
│   ├── App.jsx                       # Router setup (React Router v6)
│   │
│   ├── assets/                       # Static images, fonts
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # Base design system
│   │   │   ├── Button.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Spinner.jsx
│   │   │
│   │   ├── feed/
│   │   │   ├── FeedCard.jsx          # Single outfit card in feed
│   │   │   ├── FeedList.jsx          # Scrollable feed list
│   │   │   ├── LikeButton.jsx
│   │   │   ├── CommentSheet.jsx      # Bottom sheet for comments
│   │   │   └── ReactionPicker.jsx
│   │   │
│   │   ├── calendar/
│   │   │   ├── CalendarGrid.jsx      # Monthly grid with outfit thumbnails
│   │   │   ├── CalendarDay.jsx       # Individual day cell
│   │   │   └── MonthNavigator.jsx
│   │   │
│   │   ├── capture/
│   │   │   ├── CameraView.jsx        # Native camera access via getUserMedia
│   │   │   ├── CaptureTimer.jsx      # 2-minute countdown
│   │   │   ├── PhotoPreview.jsx
│   │   │   └── TagEditor.jsx         # Manual tag editing after AI tagging
│   │   │
│   │   ├── wardrobe/
│   │   │   ├── WardrobeGrid.jsx
│   │   │   ├── WardrobeItemCard.jsx
│   │   │   ├── UtilizationChart.jsx  # Recharts bar/pie chart
│   │   │   └── PairingCard.jsx       # AI pairing suggestion card
│   │   │
│   │   ├── digest/
│   │   │   ├── DigestCard.jsx
│   │   │   └── SustainabilityBadge.jsx
│   │   │
│   │   └── layout/
│   │       ├── BottomNav.jsx         # Mobile bottom navigation bar
│   │       ├── TopBar.jsx
│   │       └── ProtectedRoute.jsx
│   │
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Feed.jsx
│   │   ├── Capture.jsx
│   │   ├── Calendar.jsx
│   │   ├── CalendarDay.jsx
│   │   ├── OutfitDetail.jsx
│   │   ├── Profile.jsx
│   │   ├── Wardrobe.jsx
│   │   ├── WardrobeInsights.jsx
│   │   ├── WeeklyDigest.jsx
│   │   ├── Search.jsx
│   │   └── Settings.jsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.js                # Supabase auth state
│   │   ├── useOutfits.js             # Outfit CRUD + realtime
│   │   ├── useCalendar.js
│   │   ├── useFeed.js
│   │   ├── useWardrobe.js
│   │   ├── useCamera.js              # getUserMedia wrapper
│   │   ├── usePushNotifications.js   # Web Push subscription
│   │   └── useDigest.js
│   │
│   ├── lib/
│   │   ├── supabase.js               # Supabase client init
│   │   ├── gemini.js                 # Client-side helper (calls Edge Fn)
│   │   └── utils.js                  # Date helpers, formatters
│   │
│   ├── store/                        # Zustand global state
│   │   ├── authStore.js
│   │   ├── feedStore.js
│   │   └── captureStore.js
│   │
│   └── styles/
│       └── index.css                 # Tailwind base + custom CSS vars
│
├── supabase/
│   ├── functions/
│   │   ├── analyze-outfit/index.ts
│   │   ├── remove-bg/index.ts
│   │   ├── weekly-digest/index.ts
│   │   └── push-notify/index.ts
│   └── migrations/
│       └── 001_initial_schema.sql    # Full SQL from Section 5
│
├── .env.local                        # Local env variables (never commit)
├── .env.example                      # Template (safe to commit)
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 11. Environment Variables

```env
# ============================================================
# DATED APP — Environment Variables
# Copy to .env.local — NEVER commit .env.local to git
# ============================================================

# --- Supabase ---
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# (Edge Functions only — never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# --- AI & Computer Vision ---
GEMINI_API_KEY=your-google-gemini-api-key
REMOVE_BG_API_KEY=your-removebg-api-key

# --- Web Push (VAPID) ---
# Generate with: npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# --- App Config ---
VITE_APP_NAME=Dated
VITE_APP_URL=https://dated.app
```

> **How to generate VAPID keys:**
> ```bash
> npx web-push generate-vapid-keys
> ```
> Copy `Public Key` → `VITE_VAPID_PUBLIC_KEY`, `Private Key` → `VAPID_PRIVATE_KEY`

---

## 12. Key NPM Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@supabase/supabase-js": "^2.45.0",
    "zustand": "^4.5.4",
    "lucide-react": "^0.383.0",
    "recharts": "^2.12.7",
    "web-push": "^3.6.7",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite-plugin-pwa": "^0.20.5",
    "workbox-window": "^7.1.0",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20"
  }
}
```

**Install command:**
```bash
npm create vite@latest dated -- --template react
cd dated
npm install react-router-dom @supabase/supabase-js zustand lucide-react recharts web-push date-fns clsx tailwind-merge
npm install -D vite-plugin-pwa workbox-window tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 13. PWA Config (vite.config.js)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png", "screenshots/*.png"],
      manifest: {
        name: "Dated — Daily Fashion Archive",
        short_name: "Dated",
        description: "Capture your authentic daily outfits and build your personal style history.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["lifestyle", "social", "fashion"],
        icons: [
          { src: "/icons/icon-72x72.png",   sizes: "72x72",   type: "image/png" },
          { src: "/icons/icon-96x96.png",   sizes: "96x96",   type: "image/png" },
          { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
          { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ],
        screenshots: [
          { src: "/screenshots/feed.png",     sizes: "390x844", type: "image/png", form_factor: "narrow",  label: "Daily Feed" },
          { src: "/screenshots/calendar.png", sizes: "390x844", type: "image/png", form_factor: "narrow",  label: "Calendar Archive" }
        ],
        shortcuts: [
          { name: "Capture Outfit", short_name: "Capture", description: "Open the daily capture camera", url: "/capture", icons: [{ src: "/icons/shortcut-capture.png", sizes: "96x96" }] },
          { name: "My Calendar",    short_name: "Calendar", description: "Browse your outfit history",   url: "/calendar", icons: [{ src: "/icons/shortcut-calendar.png", sizes: "96x96" }] }
        ]
      },
      workbox: {
        // Cache strategies
        runtimeCaching: [
          {
            // Cache Supabase Storage images (outfit photos)
            urlPattern: /https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "outfit-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Cache Supabase API calls (calendar grid, feed)
            urlPattern: /https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5 minutes
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" }
          }
        ],
        // Pre-cache app shell
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Skip waiting so updates apply immediately
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true // Enable PWA in development for testing
      }
    })
  ],
  server: {
    port: 3000
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          charts: ["recharts"]
        }
      }
    }
  }
});
```

---

## 14. Demo Script (Presentation Flow for skripsi)

### Scene 1 — Problem Statement (1 min)
1. Open Instagram, show a hyper-curated fashion post. Narrate: *"Social media has conditioned us to only share 'perfect' moments."*
2. Open phone gallery, show 1,000+ unsorted photos. Narrate: *"Where did Tuesday's outfit go? Buried under screenshots."*
3. Ask: *"How many times have you bought something because you 'had nothing to wear'?"*

---

### Scene 2 — PWA Install Demo (30 sec)
1. Open Chrome on mobile → navigate to `https://dated.app`
2. Tap browser prompt **"Add to Home Screen"** → app icon appears on home screen.
3. Open from home screen → show splash screen, no address bar. *"No app store, no install friction."*

---

### Scene 3 — Daily Capture (BeReal flow) (2 min)
1. App sends push notification: *"✨ Time to DATED! 2 minutes to capture your look."*
2. Tap notification → opens `/capture` with 2:00 countdown timer.
3. Take photo using camera.
4. Show **AI tagging in progress** spinner.
5. Reveal tags: `[tops] [white] [oversized] [casual] [H&M]`
6. Tap **"Remove Background"** → photo transforms to clean studio-style cutout.
7. Add caption, confirm → outfit saved. *"Captured, tagged, archived — in under a minute."*

---

### Scene 4 — Calendar Grid Archive (1 min)
1. Navigate to `/calendar`.
2. Show month grid with outfit thumbnails on each day.
3. Tap a past day → show outfit detail with tags and wear count.
4. Pinch to zoom out to year view (if implemented) or swipe to previous month.
5. *"Every outfit, every day, organized automatically."*

---

### Scene 5 — Social Feed (1 min)
1. Navigate to `/feed`.
2. Show friends' daily captures in chronological order (no algorithm).
3. Double-tap to like, swipe up to comment.
4. Show reaction picker (🔥 ✨ 💅).
5. *"A feed that shows real outfits, not ads or influencers."*

---

### Scene 6 — Wardrobe Insights & AI (1.5 min)
1. Navigate to `/wardrobe/insights`.
2. Show **Utilization Score** chart (Recharts bar chart): items worn vs dormant.
3. Highlight most-worn item (🏆 badge) and least-worn item.
4. Show AI pairing recommendation: *"Try your black blazer with your wide-leg jeans — you haven't paired them yet!"*
5. *"Turn your existing wardrobe into your stylist."*

---

### Scene 7 — Weekly AI Digest (30 sec)
1. Navigate to `/digest`.
2. Show weekly summary card:
   - 🗓 5 outfits captured
   - ♻️ 3 reworn items
   - 🎨 Color palette: black, white, beige
   - Sustainability score: 78/100
3. Read AI summary: *"Great week! You rewore 3 outfits and cut your carbon footprint."*

---

### Scene 8 — Closing (30 sec)
1. Show app icon on home screen again.
2. Narrate: *"Dated solves three real problems: inauthenticity, data chaos, and overconsumption — with one simple daily habit."*
3. QR code for live demo URL.

---

## 15. Presentation Constraints & Notes

- **Demo device:** Use a real Android or iOS device for the PWA install demo — browser DevTools mobile emulation cannot demonstrate the "Add to Home Screen" prompt.
- **Test data:** Seed the database with at least 30 days of outfit photos before the demo so the calendar grid looks full and impressive.
- **API quotas:** Gemini Flash free tier supports 15 RPM / 1M TPM — sufficient for demos. remove.bg free tier: 50 API calls/month. Pre-process demo photos before the presentation to avoid live API calls.
- **Offline demo:** Enable airplane mode after loading the app to demonstrate PWA offline capability (cached calendar grid still renders).
- **Supabase Realtime:** Open the app on two devices side-by-side to show a live like/comment update without page refresh.
- **Network:** Ensure stable Wi-Fi at the presentation venue. Have a mobile hotspot as backup.
- **Scrum documentation:** Prepare sprint board screenshot (Trello/Jira) showing 2 completed sprints with backlog → done columns — assessors often ask to see Scrum artifacts.
