import { ArrowLeft, Calendar, ChevronRight, Palette, RefreshCw, Sparkles, Tag, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

// Helper: get start/end of current week (Mon–Sun)
function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = (day === 0 ? -6 : 1 - day)
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function WeekNav({ offset, onChange }) {
  const now = new Date()
  const base = new Date(now)
  base.setDate(now.getDate() + offset * 7)
  const day = base.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(base)
  monday.setDate(base.getDate() + diffToMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const label =
    offset === 0
      ? "This week"
      : offset === -1
      ? "Last week"
      : `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
      <button
        onClick={() => onChange(offset - 1)}
        style={{
          background: "none",
          border: "none",
          padding: "8px",
          cursor: "pointer",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
        }}
        aria-label="Previous week"
      >
        <ArrowLeft size={18} />
      </button>
      <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</span>
      <button
        onClick={() => offset < 0 && onChange(offset + 1)}
        style={{
          background: "none",
          border: "none",
          padding: "8px",
          cursor: "pointer",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: offset < 0 ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
          opacity: offset < 0 ? 1 : 0.3,
        }}
        aria-label="Next week"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function OutfitStrip({ outfits }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  // Map outfits by weekday index
  const byDay = {}
  outfits.forEach((o) => {
    const d = new Date(o.capture_date)
    const idx = (d.getDay() + 6) % 7 // Mon=0
    byDay[idx] = o
  })

  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "space-between" }}>
      {days.map((day, i) => {
        const outfit = byDay[i]
        return (
          <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "3/4",
                borderRadius: "8px",
                overflow: "hidden",
                border: outfit
                  ? "1.5px solid var(--color-border-secondary)"
                  : "1px dashed var(--color-border-tertiary)",
                background: outfit ? "transparent" : "var(--color-background-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {outfit?.processed_image_url ? (
                <img
                  src={outfit.processed_image_url}
                  alt={outfit.caption || "Outfit"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : outfit?.raw_image_url ? (
                <img
                  src={outfit.raw_image_url}
                  alt={outfit.caption || "Outfit"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "16px", color: "var(--color-text-tertiary)" }}>—</span>
              )}
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{day}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        background: "var(--color-background-secondary)",
        borderRadius: "10px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <Icon size={15} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>{label}</div>
      </div>
    </div>
  )
}

function TagBubble({ tag }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        background: "var(--color-background-secondary)",
        borderRadius: "20px",
        fontSize: "12px",
        color: "var(--color-text-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        whiteSpace: "nowrap",
      }}
    >
      {tag}
    </span>
  )
}

function DigestCard({ digest, loading }) {
  if (loading) {
    return (
      <div
        style={{
          background: "var(--color-background-primary)",
          borderRadius: "16px",
          border: "0.5px solid var(--color-border-tertiary)",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Sparkles size={16} style={{ color: "var(--color-text-secondary)" }} />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
            AI is reading your week…
          </span>
        </div>
        {[90, 75, 60, 85].map((w, i) => (
          <div
            key={i}
            style={{
              height: "12px",
              width: `${w}%`,
              borderRadius: "6px",
              background: "var(--color-background-secondary)",
              marginBottom: "10px",
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
      </div>
    )
  }

  if (!digest) return null

  const paragraphs = digest.split("\n\n").filter(Boolean)

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        borderRadius: "16px",
        border: "0.5px solid var(--color-border-tertiary)",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <Sparkles size={15} style={{ color: "var(--color-text-secondary)" }} />
        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em" }}>
          AI DIGEST
        </span>
      </div>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: "14px",
            lineHeight: 1.65,
            color: "var(--color-text-primary)",
            margin: "0 0 12px",
          }}
        >
          {p}
        </p>
      ))}
    </div>
  )
}

export default function Digest() {
  const navigate = useNavigate()
  const [weekOffset, setWeekOffset] = useState(0)
  const [outfits, setOutfits] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [digestLoading, setDigestLoading] = useState(false)
  const [digest, setDigest] = useState(null)
  const [error, setError] = useState(null)

  // Fetch outfits for selected week
  useEffect(() => {
    setLoading(true)
    setDigest(null)
    setError(null)
    fetchWeekData()
  }, [weekOffset])

  async function fetchWeekData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate("/login"); return }

      const now = new Date()
      const base = new Date(now)
      base.setDate(now.getDate() + weekOffset * 7)
      const day = base.getDay()
      const diffToMon = day === 0 ? -6 : 1 - day
      const monday = new Date(base)
      monday.setDate(base.getDate() + diffToMon)
      monday.setHours(0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      const { data: outfitData, error: outfitErr } = await supabase
        .from("outfits")
        .select("id, capture_date, caption, raw_image_url, processed_image_url, is_deleted")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .gte("capture_date", monday.toISOString().split("T")[0])
        .lte("capture_date", sunday.toISOString().split("T")[0])
        .order("capture_date", { ascending: true })

      if (outfitErr) throw outfitErr

      setOutfits(outfitData || [])

      if (outfitData && outfitData.length > 0) {
        const ids = outfitData.map((o) => o.id)
        const { data: tagData } = await supabase
          .from("outfit_tags")
          .select("tag_value, tag_type")
          .in("outfit_id", ids)

        setTags(tagData || [])
      } else {
        setTags([])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateDigest() {
    if (outfits.length === 0) return
    setDigestLoading(true)
    setDigest(null)

    try {
      // Build a rich summary for the AI
      const outfitSummaries = outfits.map((o) => {
        const outfitTags = tags
          .filter((t) => o.id === t.outfit_id)
          .map((t) => t.tag_value)
          .join(", ")
        return `- ${formatDateLabel(o.capture_date)}: ${o.caption || "No caption"}${outfitTags ? `. Items: ${outfitTags}` : ""}`
      }).join("\n")

      const allTagValues = tags.map((t) => t.tag_value)
      const tagFreq = allTagValues.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc }, {})
      const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t).join(", ")

      const prompt = `You're a friendly and perceptive personal stylist AI inside a fashion journaling app called Dated. 

Here's the user's outfit journal for the week:

${outfitSummaries}

Most worn items/tags this week: ${topTags || "none detected"}

Write a warm, insightful weekly digest in 3 short paragraphs (no headings, no bullet points, no markdown):
1. A brief, personal summary of their week in style — what story their outfits tell together
2. A standout pattern, recurring piece, or interesting style choice you noticed
3. One gentle, encouraging suggestion for next week based on their vibe

Keep it conversational and encouraging, like a thoughtful friend who notices details. Under 150 words total.`

      const { data, error } = await supabase.functions.invoke("generate-digest", {
        body: { prompt },
      })
      if (error) throw error
      const text = data.text
      setDigest(text || "Could not generate digest. Try again.")
    } catch (e) {
      setDigest("Something went wrong generating your digest. Try again.")
    } finally {
      setDigestLoading(false)
    }
  }

  // Derived stats
  const outfitCount = outfits.length
  const allColors = tags.filter((t) => t.tag_type === "color").map((t) => t.tag_value)
  const topColor = allColors.length > 0
    ? Object.entries(allColors.reduce((a, c) => { a[c] = (a[c] || 0) + 1; return a }, {})).sort((a, b) => b[1] - a[1])[0][0]
    : null
  const topItems = [...new Set(tags.filter((t) => t.tag_type === "item").map((t) => t.tag_value))].slice(0, 6)
  const topStyles = [...new Set(tags.filter((t) => t.tag_type === "style").map((t) => t.tag_value))].slice(0, 4)

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-background-tertiary)",
        paddingBottom: "80px",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--color-background-tertiary)",
          padding: "16px 20px 12px",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              display: "flex",
              color: "var(--color-text-primary)",
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: "17px", fontWeight: 600, margin: 0, color: "var(--color-text-primary)" }}>
            Weekly Digest
          </h1>
        </div>
        <WeekNav offset={weekOffset} onChange={setWeekOffset} />
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "center",
              padding: "40px 0",
              color: "var(--color-text-secondary)",
              fontSize: "14px",
            }}
          >
            Loading your week…
          </div>
        ) : outfits.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--color-text-secondary)",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            <Calendar size={32} style={{ marginBottom: "12px", opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No outfits logged this week.</p>
            <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
              Capture some looks to get your digest.
            </p>
          </div>
        ) : (
          <>
            {/* Outfit strip */}
            <div
              style={{
                background: "var(--color-background-primary)",
                borderRadius: "16px",
                border: "0.5px solid var(--color-border-tertiary)",
                padding: "16px",
              }}
            >
              <OutfitStrip outfits={outfits} />
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "10px" }}>
              <StatPill icon={Calendar} label="outfits" value={outfitCount} />
              {topColor && <StatPill icon={Palette} label="top color" value={topColor} />}
              {topItems.length > 0 && <StatPill icon={TrendingUp} label="items" value={topItems.length} />}
            </div>

            {/* Tags */}
            {topItems.length > 0 && (
              <div
                style={{
                  background: "var(--color-background-primary)",
                  borderRadius: "16px",
                  border: "0.5px solid var(--color-border-tertiary)",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <Tag size={13} style={{ color: "var(--color-text-secondary)" }} />
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em" }}>
                    THIS WEEK'S PIECES
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {topItems.map((t) => <TagBubble key={t} tag={t} />)}
                  {topStyles.map((t) => <TagBubble key={t} tag={t} />)}
                </div>
              </div>
            )}

            {/* AI Digest */}
            {digest || digestLoading ? (
              <DigestCard digest={digest} loading={digestLoading} />
            ) : (
              <button
                onClick={generateDigest}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "var(--color-background-primary)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                }}
              >
                <Sparkles size={16} />
                Generate AI Digest
              </button>
            )}

            {/* Regenerate */}
            {digest && !digestLoading && (
              <button
                onClick={generateDigest}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <RefreshCw size={13} />
                Regenerate
              </button>
            )}
          </>
        )}

        {error && (
          <p style={{ fontSize: "13px", color: "var(--color-text-danger)", textAlign: "center" }}>{error}</p>
        )}
      </div>
    </div>
  )
}
