import {
  BarChart2,
  Check,
  ChevronLeft,
  Edit3,
  Package,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Tag,
  Trash2,
  X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Footwear', 'Accessories', 'Other']
const CATEGORY_OPTIONS = ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Footwear', 'Accessories', 'Other']

const COLOR_SWATCHES = [
  { label: 'Black', hex: '#1a1a1a' },
  { label: 'White', hex: '#f5f5f5' },
  { label: 'Gray', hex: '#9ca3af' },
  { label: 'Navy', hex: '#1e3a5f' },
  { label: 'Blue', hex: '#3b82f6' },
  { label: 'Red', hex: '#ef4444' },
  { label: 'Pink', hex: '#ec4899' },
  { label: 'Green', hex: '#22c55e' },
  { label: 'Brown', hex: '#92400e' },
  { label: 'Beige', hex: '#d4b896' },
  { label: 'Yellow', hex: '#eab308' },
  { label: 'Purple', hex: '#a855f7' },
]

const CATEGORY_ICONS = {
  Tops: Shirt,
  Bottoms: Package,
  Outerwear: Package,
  Dresses: Package,
  Footwear: Package,
  Accessories: Tag,
  Other: Package,
}

export default function Wardrobe() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [form, setForm] = useState({
    name: '',
    category: 'Tops',
    color: '',
    brand: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user.id)
      .order('times_worn', { ascending: false })
    if (!error) setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', category: 'Tops', color: '', brand: '' })
    setFormError('')
    setShowAddSheet(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, category: item.category, color: item.color || '', brand: item.brand || '' })
    setFormError('')
    setShowAddSheet(true)
  }

  const closeSheet = () => {
    setShowAddSheet(false)
    setEditItem(null)
    setFormError('')
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    if (editItem) {
      const { error } = await supabase
        .from('wardrobe_items')
        .update({ name: form.name.trim(), category: form.category, color: form.color, brand: form.brand })
        .eq('id', editItem.id)
      if (error) { setFormError('Failed to update item'); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('wardrobe_items')
        .insert({ user_id: user.id, name: form.name.trim(), category: form.category, color: form.color, brand: form.brand, times_worn: 0, is_active: true })
      if (error) { setFormError('Failed to add item'); setSaving(false); return }
    }
    await fetchItems()
    setSaving(false)
    closeSheet()
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('wardrobe_items').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
    setDeleteConfirm(null)
  }

  const handleLogWear = async (item, delta) => {
    const newCount = Math.max(0, (item.times_worn || 0) + delta)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, times_worn: newCount } : i))
    const { error } = await supabase
      .from('wardrobe_items')
      .update({ times_worn: newCount })
      .eq('id', item.id)
    if (error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, times_worn: item.times_worn } : i))
    }
  }

  const filtered = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalItems = items.length
  const totalWears = items.reduce((sum, i) => sum + (i.times_worn || 0), 0)
  const topItem = [...items].sort((a, b) => (b.times_worn || 0) - (a.times_worn || 0))[0]

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif", paddingBottom: '6rem' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)', borderBottom: '0.5px solid rgba(255,255,255,0.07)', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#f0ede8', cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px' }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', letterSpacing: '-0.01em' }}>Wardrobe</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => navigate('/wardrobe/insights')}
              style={{ background: 'none', border: 'none', color: '#8a8580', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
              aria-label="Insights"
            >
              <BarChart2 size={20} />
            </button>
            <button
              onClick={openAdd}
              style={{ background: '#f0ede8', border: 'none', color: '#0a0a0a', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '500' }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '1rem 1rem 0' }}>
          {[
            { label: 'Items', value: totalItems },
            { label: 'Total wears', value: totalWears },
            { label: 'Most worn', value: topItem ? topItem.times_worn : 0 },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: '500', margin: 0, lineHeight: 1.1 }}>{stat.value}</p>
              <p style={{ fontSize: '11px', color: '#6b6760', margin: '4px 0 0', letterSpacing: '0.03em' }}>{stat.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Digest link */}
      <div style={{ padding: '12px 1rem 0' }}>
        <button
          onClick={() => navigate('/digest')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(184,149,90,0.1)', border: '0.5px solid rgba(184,149,90,0.25)', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', color: '#f0ede8', boxSizing: 'border-box' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={16} color="#b8955a" />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Weekly Digest</span>
          </div>
          <span style={{ fontSize: '12px', color: '#8a8580' }}>View →</span>
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '1rem 1rem 0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b6760', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search items or brands…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px 10px 34px', color: '#f0ede8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b6760', cursor: 'pointer', padding: '2px' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div style={{ overflowX: 'auto', padding: '12px 1rem', display: 'flex', gap: '6px', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0,
              background: activeCategory === cat ? '#f0ede8' : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: activeCategory === cat ? '500' : '400',
              color: activeCategory === cat ? '#0a0a0a' : '#8a8580',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', height: '72px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasItems={items.length > 0} onAdd={openAdd} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => setDeleteConfirm(item.id)}
                onLogWear={(delta) => handleLogWear(item, delta)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Sheet */}
      {showAddSheet && (
        <AddEditSheet
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={closeSheet}
          saving={saving}
          error={formError}
          isEdit={!!editItem}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.6)' }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ width: '100%', background: '#1a1917', borderRadius: '20px 20px 0 0', padding: `1.25rem 1rem calc(env(safe-area-inset-bottom, 0px) + 80px)` }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '15px', fontWeight: '500', textAlign: 'center', marginBottom: '4px' }}>Remove this item?</p>
            <p style={{ fontSize: '13px', color: '#6b6760', textAlign: 'center', marginBottom: '1.5rem' }}>It will be removed from all outfit records</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '12px', padding: '14px', color: '#f0ede8', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, background: '#ef4444', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
    </div>
  )
}

function ItemRow({ item, onEdit, onDelete, onLogWear }) {
  const Icon = CATEGORY_ICONS[item.category] || Package
  const colorHex = COLOR_SWATCHES.find(c => c.label.toLowerCase() === (item.color || '').toLowerCase())?.hex

  const longPressTimer = useRef(null)
  const didLongPress = useRef(false)

  const handlePressStart = () => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      if (item.times_worn > 0) onLogWear(-1)
    }, 500)
  }

  const handlePressEnd = () => {
    clearTimeout(longPressTimer.current)
  }

  const handleTap = () => {
    if (!didLongPress.current) onLogWear(1)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px 14px', gap: '12px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        <Icon size={20} color="#8a8580" />
        {colorHex && (
          <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: colorHex, border: '1px solid rgba(255,255,255,0.2)' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b6760' }}>
          {[item.brand, item.category].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginRight: '4px' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{item.times_worn || 0}</p>
        <p style={{ margin: 0, fontSize: '11px', color: '#6b6760' }}>wears</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          onClick={handleTap}
          title="Tap to add · Hold to undo"
          style={{
            background: 'rgba(240,237,232,0.08)',
            border: '0.5px solid rgba(240,237,232,0.18)',
            borderRadius: '8px',
            color: '#f0ede8',
            cursor: 'pointer',
            padding: '3px 7px',
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          +
        </button>
        <button onClick={onEdit} style={{ background: 'none', border: 'none', color: '#8a8580', cursor: 'pointer', padding: '4px' }}>
          <Edit3 size={15} />
        </button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#6b6760', cursor: 'pointer', padding: '4px' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

function EmptyState({ hasItems, onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
        {hasItems ? <Search size={28} color="#6b6760" /> : <Shirt size={28} color="#6b6760" />}
      </div>
      <p style={{ fontSize: '17px', fontWeight: '500', margin: '0 0 6px' }}>
        {hasItems ? 'No items match' : 'Your wardrobe is empty'}
      </p>
      <p style={{ fontSize: '14px', color: '#6b6760', margin: '0 0 1.5rem' }}>
        {hasItems ? 'Try a different search or category' : 'Add your first clothing item to start tracking wears'}
      </p>
      {!hasItems && (
        <button
          onClick={onAdd}
          style={{ background: '#f0ede8', border: 'none', borderRadius: '12px', padding: '12px 24px', color: '#0a0a0a', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Add item
        </button>
      )}
    </div>
  )
}

function AddEditSheet({ form, setForm, onSave, onClose, saving, error, isEdit }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <div
        style={{ width: '100%', background: '#141412', borderRadius: '20px 20px 0 0', padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 64px)', maxHeight: '90dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', margin: '12px auto 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 1rem 12px' }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px' }}>{isEdit ? 'Edit item' : 'Add item'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b6760', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '0 1rem 1rem' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6b6760', letterSpacing: '0.05em', marginBottom: '6px' }}>NAME *</label>
          <input
            type="text"
            placeholder="e.g. White linen shirt"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px', color: '#f0ede8', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '1.25rem' }}
          />

          <label style={{ display: 'block', fontSize: '12px', color: '#6b6760', letterSpacing: '0.05em', marginBottom: '6px' }}>CATEGORY</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '1.25rem' }}>
            {CATEGORY_OPTIONS.map(cat => (
              <button
                key={cat}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                style={{
                  background: form.category === cat ? 'rgba(240,237,232,0.12)' : 'rgba(255,255,255,0.04)',
                  border: form.category === cat ? '1px solid rgba(240,237,232,0.3)' : '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: form.category === cat ? '#f0ede8' : '#6b6760',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {form.category === cat && <Check size={12} />}
                {cat}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: '12px', color: '#6b6760', letterSpacing: '0.05em', marginBottom: '8px' }}>COLOR</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem' }}>
            {COLOR_SWATCHES.map(swatch => (
              <button
                key={swatch.label}
                title={swatch.label}
                onClick={() => setForm(f => ({ ...f, color: f.color === swatch.label ? '' : swatch.label }))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: swatch.hex,
                  border: form.color === swatch.label ? '2px solid #f0ede8' : '2px solid transparent',
                  cursor: 'pointer',
                  outline: form.color === swatch.label ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  outlineOffset: '2px',
                  boxShadow: swatch.label === 'White' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : 'none',
                }}
              />
            ))}
          </div>

          <label style={{ display: 'block', fontSize: '12px', color: '#6b6760', letterSpacing: '0.05em', marginBottom: '6px' }}>BRAND (OPTIONAL)</label>
          <input
            type="text"
            placeholder="e.g. Uniqlo, Zara, vintage…"
            value={form.brand}
            onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px', color: '#f0ede8', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '1.5rem' }}
          />

          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

          <button
            onClick={onSave}
            disabled={saving}
            style={{ width: '100%', background: '#f0ede8', border: 'none', borderRadius: '14px', padding: '15px', color: '#0a0a0a', fontSize: '15px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add to wardrobe'}
          </button>
        </div>
      </div>
    </div>
  )
}
