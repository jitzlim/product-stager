'use client'

import { useState, useRef, useCallback } from 'react'
import { BACKGROUNDS, buildPrompt } from '@/lib/backgrounds'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.48" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconChevron({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function IconHistory() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size = 16, color = '#00CFC8' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}33`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, label }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-2 py-1.5 text-left"
    >
      <div
        className="flex items-center justify-center rounded flex-shrink-0"
        style={{
          width: 20,
          height: 20,
          background: checked ? '#00CFC8' : 'transparent',
          border: checked ? '2px solid #00CFC8' : '2px solid #D1D5DB',
          transition: 'all 0.15s',
        }}
      >
        {checked && <IconCheck />}
      </div>
      <span className="text-xs font-bold tracking-wide text-gray-500">{label}</span>
    </button>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 48,
        height: 26,
        borderRadius: 13,
        background: on ? '#00CFC8' : '#D1D5DB',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: 3,
          left: on ? 25 : 3,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const DEFAULT_BACKGROUNDS = ['BEDROOM', 'OUTDOOR', 'TABLE', 'CAR', 'LIBRARY']

export default function Home() {
  const [handModel, setHandModel] = useState('neutral')
  const [selectedBgs, setSelectedBgs] = useState(DEFAULT_BACKGROUNDS)
  const [smartMix, setSmartMix] = useState(true)
  const [customInstructions, setCustomInstructions] = useState('')
  const [configOpen, setConfigOpen] = useState(true)

  const [products, setProducts] = useState([])
  const [results, setResults] = useState([])
  const [view, setView] = useState('config') // 'config' | 'results'

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [errors, setErrors] = useState([])

  const fileInputRef = useRef(null)

  const selectedProducts = products.filter((p) => p.selected)
  const selectedCount = selectedProducts.length

  // ── File upload ─────────────────────────────────────────────────────────────

  const handleFiles = useCallback((files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        const base64 = dataUrl.split(',')[1]
        setProducts((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 30),
            base64,
            mimeType: file.type || 'image/jpeg',
            preview: dataUrl,
            selected: true,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  // ── Background toggle ───────────────────────────────────────────────────────

  const toggleBg = (id) => {
    setSelectedBgs((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )
  }

  // ── Product selection ───────────────────────────────────────────────────────

  const toggleProduct = (id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    )
  }

  const selectAll = () => setProducts((prev) => prev.map((p) => ({ ...p, selected: true })))

  const deleteSelected = () =>
    setProducts((prev) => prev.filter((p) => !p.selected))

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (selectedCount === 0 || selectedBgs.length === 0 || isGenerating) return

    setIsGenerating(true)
    setErrors([])
    setResults([])
    setProgress({ current: 0, total: selectedCount })
    setView('results')

    const newResults = []

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i]

      // Pick background
      const bgPool = selectedBgs.length > 0 ? selectedBgs : DEFAULT_BACKGROUNDS
      const bgId = smartMix
        ? bgPool[Math.floor(Math.random() * bgPool.length)]
        : bgPool[i % bgPool.length]

      const prompt = buildPrompt(handModel, bgId, customInstructions)

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productImageBase64: product.base64,
            mimeType: product.mimeType,
            prompt,
          }),
        })

        const data = await res.json()

        if (data.imageBase64) {
          const result = {
            id: `result-${Date.now()}-${i}`,
            productName: product.name,
            imageBase64: data.imageBase64,
            imageMimeType: data.mimeType ?? 'image/jpeg',
            background: bgId,
          }
          newResults.push(result)
          setResults([...newResults])
        } else {
          setErrors((prev) => [...prev, `${product.name}: ${data.error ?? 'Failed'}`])
        }
      } catch (err) {
        setErrors((prev) => [...prev, `${product.name}: Network error`])
      }

      setProgress({ current: i + 1, total: selectedCount })
    }

    setIsGenerating(false)
  }

  // ── Download ────────────────────────────────────────────────────────────────

  const handleDownload = (result) => {
    const link = document.createElement('a')
    link.href = `data:${result.imageMimeType};base64,${result.imageBase64}`
    link.download = `${result.productName.toLowerCase().replace(/\s+/g, '-')}-staged.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setResults([])
    setErrors([])
    setProgress({ current: 0, total: 0 })
    setView('config')
    setIsGenerating(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const canGenerate = selectedCount > 0 && selectedBgs.length > 0 && !isGenerating
  const pendingCount = progress.total - progress.current

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: '#F2F2F7',
          maxWidth: 430,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* ── Sticky Header ── */}
        <div
          style={{
            background: '#111111',
            paddingTop: 48,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Branding row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* App icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: '#222',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                📱
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ color: 'white', fontWeight: 900, fontSize: 17, letterSpacing: '-0.5px' }}>
                    BULK STAGER
                  </span>
                  <span style={{ color: '#FF3B30', fontWeight: 900, fontSize: 17 }}>v1.0</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 3, fontWeight: 700 }}>
                  BULK AI CONTENT ENGINE
                </div>
              </div>
            </div>
            <button style={{ color: 'rgba(255,255,255,0.5)', padding: 8 }}>
              <IconHistory />
            </button>
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Reset */}
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '13px 0',
                borderRadius: 14,
                border: '1.5px solid rgba(255,255,255,0.25)',
                background: 'transparent',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <IconRefresh />
              Reset
            </button>

            {/* Generate / Back */}
            {view === 'results' && !isGenerating ? (
              <button
                onClick={() => setView('config')}
                style={{
                  flex: 2,
                  padding: '13px 0',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <IconArrowLeft />
                Back to Config
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                  flex: 2,
                  padding: '13px 0',
                  borderRadius: 14,
                  background: isGenerating
                    ? '#333'
                    : canGenerate
                    ? 'white'
                    : 'rgba(255,255,255,0.15)',
                  color: isGenerating ? 'rgba(255,255,255,0.5)' : canGenerate ? '#111' : 'rgba(255,255,255,0.4)',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: canGenerate ? 'pointer' : 'default',
                  border: 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {isGenerating ? (
                  <>
                    <Spinner size={14} color="#00CFC8" />
                    {progress.current}/{progress.total}
                  </>
                ) : (
                  <>
                    <IconPlay />
                    Generate ({selectedCount})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ paddingBottom: 40 }}>

          {/* ═══════════════ CONFIG VIEW ═══════════════ */}
          {view === 'config' && (
            <>
              {/* Configuration Card */}
              <div
                style={{
                  margin: '16px 16px 0',
                  background: 'white',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {/* Section header */}
                <button
                  onClick={() => setConfigOpen(!configOpen)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: '#6B7280' }}>
                    CONFIGURATION
                  </span>
                  <span style={{ color: '#9CA3AF' }}>
                    <IconChevron open={configOpen} />
                  </span>
                </button>

                {configOpen && (
                  <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Hand Model */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>✋</span>
                        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: '#9CA3AF' }}>
                          HAND MODEL
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['neutral', 'female', 'male'].map((model) => (
                          <button
                            key={model}
                            onClick={() => setHandModel(model)}
                            style={{
                              flex: 1,
                              padding: '12px 0',
                              borderRadius: 12,
                              border: handModel === model ? 'none' : '1.5px solid #E5E7EB',
                              background: handModel === model ? '#111' : 'transparent',
                              color: handModel === model ? 'white' : '#6B7280',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              textTransform: 'capitalize',
                            }}
                          >
                            {model.charAt(0).toUpperCase() + model.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>🏠</span>
                        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: '#9CA3AF' }}>
                          BACKGROUND
                        </span>
                      </div>

                      {/* Smart Mix row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '13px 16px',
                          background: smartMix ? '#111' : '#F5F5F7',
                          borderRadius: 14,
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: smartMix ? 'white' : '#374151',
                          }}
                        >
                          Random (Smart Mix)
                        </span>
                        <Toggle on={smartMix} onChange={() => setSmartMix(!smartMix)} />
                      </div>

                      {/* Background checkboxes — 2 columns */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '2px 8px',
                          background: '#F5F5F7',
                          borderRadius: 14,
                          padding: '10px 14px',
                        }}
                      >
                        {BACKGROUNDS.map((bg) => (
                          <Checkbox
                            key={bg.id}
                            checked={selectedBgs.includes(bg.id)}
                            onChange={() => toggleBg(bg.id)}
                            label={bg.label.toUpperCase()}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom Instructions */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>💬</span>
                        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: '#9CA3AF' }}>
                          CUSTOM INSTRUCTIONS
                        </span>
                      </div>
                      <textarea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g. Baju, supplement, skincare product, make the hand look relaxed..."
                        rows={4}
                        style={{
                          width: '100%',
                          background: '#F5F5F7',
                          borderRadius: 14,
                          padding: '14px 16px',
                          fontSize: 14,
                          color: '#374151',
                          border: '2px solid transparent',
                          outline: 'none',
                          resize: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#00CFC8')}
                        onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Queue */}
              <div style={{ margin: '16px 16px 0' }}>
                {/* Upload drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    background: 'white',
                    borderRadius: 20,
                    border: '2px dashed #D1D5DB',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '36px 20px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00CFC8')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      border: '2px solid #D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                      fontSize: 22,
                      color: '#9CA3AF',
                    }}
                  >
                    +
                  </div>
                  <span style={{ fontWeight: 800, color: '#374151', fontSize: 15 }}>Add Products</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#9CA3AF', marginTop: 4 }}>
                    UPLOAD MORE ITEMS TO QUEUE
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFiles(e.target.files)}
                />

                {/* Queue list */}
                {products.length > 0 && (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        margin: '20px 0 8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 900, fontSize: 15, fontStyle: 'italic', color: '#111' }}>
                          PRODUCT QUEUE
                        </span>
                        <span
                          style={{
                            background: '#E5E7EB',
                            color: '#6B7280',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 20,
                          }}
                        >
                          {products.length}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                      <button
                        onClick={selectAll}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00CFC8',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Select All
                      </button>
                      {products.some((p) => p.selected) && (
                        <button
                          onClick={deleteSelected}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <IconTrash />
                          Delete ({products.filter((p) => p.selected).length})
                        </button>
                      )}
                    </div>

                    {/* Thumbnail grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                      }}
                    >
                      {products.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => toggleProduct(product.id)}
                          style={{
                            position: 'relative',
                            borderRadius: 18,
                            overflow: 'hidden',
                            aspectRatio: '3/4',
                            background: '#E5E7EB',
                            cursor: 'pointer',
                            outline: product.selected ? '2.5px solid #00CFC8' : '2.5px solid transparent',
                            transition: 'outline 0.15s',
                          }}
                        >
                          <img
                            src={product.preview}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {/* Select indicator */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: product.selected ? '#00CFC8' : 'rgba(0,0,0,0.35)',
                              border: product.selected ? '2px solid #00CFC8' : '2px solid rgba(255,255,255,0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                          >
                            {product.selected && <IconCheck />}
                          </div>
                          {/* Product name overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                              padding: '20px 10px 8px',
                            }}
                          >
                            <div
                              style={{
                                color: 'white',
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: 0.5,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {product.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Empty state */}
                {products.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>No products yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Upload product images above to get started</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════ RESULTS VIEW ═══════════════ */}
          {view === 'results' && (
            <div style={{ margin: '16px 16px 0' }}>

              {/* Progress bar (while generating) */}
              {isGenerating && (
                <div
                  style={{
                    background: '#111',
                    borderRadius: 18,
                    padding: '14px 18px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <Spinner size={20} color="#00CFC8" />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>
                      Generating lifestyle images...
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
                      {progress.current} of {progress.total} complete
                    </div>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: 3,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 2,
                        marginTop: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
                          background: '#00CFC8',
                          borderRadius: 2,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div
                  style={{
                    background: '#FEF2F2',
                    borderRadius: 14,
                    padding: '12px 16px',
                    marginBottom: 14,
                    border: '1px solid #FCA5A5',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#DC2626', fontSize: 12, marginBottom: 6 }}>
                    Some images failed to generate:
                  </div>
                  {errors.map((e, i) => (
                    <div key={i} style={{ color: '#EF4444', fontSize: 12 }}>• {e}</div>
                  ))}
                </div>
              )}

              {/* Results grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                {/* Completed results */}
                {results.map((result) => (
                  <div
                    key={result.id}
                    style={{
                      position: 'relative',
                      borderRadius: 18,
                      overflow: 'hidden',
                      aspectRatio: '9/16',
                      background: '#E5E7EB',
                    }}
                  >
                    <img
                      src={`data:${result.imageMimeType};base64,${result.imageBase64}`}
                      alt={result.productName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* READY badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: '#00CFC8',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 1,
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}
                    >
                      READY
                    </div>
                    {/* Bottom overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                        padding: '28px 10px 10px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <div
                          style={{
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {result.productName}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1 }}>
                          Hold to compare
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(result)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: '#00CFC8',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <IconDownload />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Loading placeholders for pending items */}
                {isGenerating &&
                  Array.from({ length: pendingCount }).map((_, i) => (
                    <div
                      key={`loading-${i}`}
                      style={{
                        position: 'relative',
                        borderRadius: 18,
                        overflow: 'hidden',
                        aspectRatio: '9/16',
                        background: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Spinner size={28} color="#00CFC8" />
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 10,
                            color: '#9CA3AF',
                            fontWeight: 600,
                            letterSpacing: 1,
                          }}
                        >
                          STAGING...
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty state: no results yet, not generating */}
              {results.length === 0 && !isGenerating && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🖼️</div>
                  <div style={{ fontWeight: 600 }}>No results yet</div>
                  <button
                    onClick={() => setView('config')}
                    style={{
                      marginTop: 14,
                      background: '#00CFC8',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      padding: '10px 20px',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Go back and configure
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
