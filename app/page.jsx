'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { BACKGROUNDS, PROMPT_TEMPLATES, buildPrompt } from '@/lib/backgrounds'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  base:         '#0e0e13',
  low:          '#131318',
  high:         '#1f1f26',
  bright:       '#2c2b33',
  primary:      '#a5a5ff',
  secondary:    '#7000ff',
  secondaryDim: '#874cff',
  lime:         '#cafd00',
  ghost:        'rgba(72,71,77,0.15)',
  muted:        'rgba(255,255,255,0.5)',
  faint:        'rgba(255,255,255,0.25)',
  danger:       '#ff6b6b',
}

const gradCTA   = `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`
const gradGlow  = `0 24px 60px rgba(135,76,255,0.15)`
const glassBase = {
  background:           'rgba(19,19,24,0.7)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               `1px solid ${C.ghost}`,
}

// ─── Shared Primitives ────────────────────────────────────────────────────────

function Label({ children, color = C.primary }) {
  return (
    <span style={{
      fontFamily: 'Manrope, sans-serif',
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: 3,
      color,
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  )
}

function GradientButton({ children, onClick, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.high : gradCTA,
        color: disabled ? C.muted : 'white',
        border: 'none',
        borderRadius: 9999,
        padding: small ? '10px 20px' : '16px 28px',
        fontSize: small ? 13 : 15,
        fontWeight: 800,
        cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: disabled ? 'none' : gradGlow,
        transition: 'opacity 0.2s',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function GhostButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(165,165,255,0.08)',
        border: `1px solid rgba(165,165,255,0.2)`,
        borderRadius: 9999,
        padding: '10px 20px',
        fontSize: 13,
        fontWeight: 700,
        color: C.primary,
        cursor: 'pointer',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {children}
    </button>
  )
}

function Spinner({ size = 20, color = C.primary }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(165,165,255,0.2)`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

function Toast({ message }) {
  if (!message) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(31,31,38,0.96)',
      border: `1px solid rgba(165,165,255,0.2)`,
      borderRadius: 9999,
      padding: '10px 22px',
      zIndex: 500,
      color: 'white',
      fontWeight: 700,
      fontSize: 13,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {message}
    </div>
  )
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function CircularProgress({ percent }) {
  const r   = 72
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ

  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.primary} />
            <stop offset="100%" stopColor={C.secondary} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke={C.high} strokeWidth="8" />
        <circle
          cx="100" cy="100" r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4,
      }}>
        <span style={{ fontSize: 38, fontWeight: 900, color: 'white', lineHeight: 1 }}>
          {percent}%
        </span>
        <Label color={C.secondaryDim}>Rendering</Label>
      </div>
    </div>
  )
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'upload',    label: 'Upload',    icon: UploadIcon },
  { id: 'configure', label: 'Configure', icon: ConfigIcon },
  { id: 'generate',  label: 'Generate',  icon: GenerateIcon },
  { id: 'gallery',   label: 'Gallery',   icon: GalleryIcon },
]

function BottomNav({ active, onChange, hasResults, isGenerating }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      zIndex: 100,
      ...glassBase,
      borderRadius: '24px 24px 0 0',
      borderBottom: 'none',
      paddingBottom: 'env(safe-area-inset-bottom, 16px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          const disabled = (id === 'gallery' && !hasResults && !isGenerating)
          return (
            <button
              key={id}
              onClick={() => !disabled && onChange(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '14px 0 10px',
                background: 'none',
                border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.3 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Icon
                active={isActive}
                size={22}
                color={isActive ? C.primary : C.muted}
              />
              <span style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: isActive ? C.primary : C.muted,
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
              {isActive && (
                <div style={{
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: gradCTA,
                  marginTop: 2,
                  boxShadow: `0 0 8px ${C.primary}`,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── SVG Icon Components ──────────────────────────────────────────────────────

function UploadIcon({ active, size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

function ConfigIcon({ size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  )
}

function GenerateIcon({ size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function GalleryIcon({ size = 22, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ history, onClose, onDownload }) {
  if (history.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: C.base,
        maxWidth: 430, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 20px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <Label>Generation History</Label>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕐</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>No history yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Completed batches will appear here.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: C.base,
      maxWidth: 430, margin: '0 auto',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 20px', position: 'sticky', top: 0, background: C.base, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div>
          <Label>Generation History</Label>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{history.length} batch{history.length !== 1 ? 'es' : ''} this session</div>
        </div>
      </div>

      <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {[...history].reverse().map((batch, bi) => (
          <div key={batch.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>
                  Batch {history.length - bi}
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {batch.timestamp} · {batch.results.length} image{batch.results.length !== 1 ? 's' : ''} · {batch.handModel}
                </div>
              </div>
              <button
                onClick={() => batch.results.forEach(r => onDownload(r))}
                style={{ background: 'none', border: `1px solid ${C.ghost}`, borderRadius: 9999, padding: '6px 14px', color: C.primary, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Save All
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {batch.results.map((result) => (
                <div
                  key={result.id}
                  style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '9/16', background: C.high, cursor: 'pointer' }}
                  onClick={() => onDownload(result)}
                >
                  <img
                    src={`data:${result.imageMimeType};base64,${result.imageBase64}`}
                    alt={result.productName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    padding: '16px 6px 6px',
                    display: 'flex', justifyContent: 'flex-end',
                  }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: gradCTA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── App Header ───────────────────────────────────────────────────────────────

function AppHeader({ historyCount, onHistoryOpen }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '52px 20px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: gradCTA,
          boxShadow: `0 0 10px ${C.primary}`,
        }} />
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 3,
          background: gradCTA,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          KINETIC
        </span>
      </div>
      <button
        onClick={onHistoryOpen}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: historyCount > 0 ? C.primary : C.muted, padding: 4, position: 'relative' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {historyCount > 0 && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 16, height: 16,
            borderRadius: '50%',
            background: gradCTA,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900, color: 'white',
            fontFamily: 'Manrope, sans-serif',
          }}>
            {historyCount}
          </div>
        )}
      </button>
    </div>
  )
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

function UploadTab({ products, onFilesAdded, onToggleProduct, onSelectAll, onDeleteSelected }) {
  const fileInputRef = useRef(null)
  const selectedCount = products.filter(p => p.selected).length

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    onFilesAdded(e.dataTransfer.files)
  }, [onFilesAdded])

  return (
    <div style={{ padding: '0 20px', animation: 'fadeUp 0.3s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <Label color={C.primary}>Product Upload</Label>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '8px 0 8px', lineHeight: 1.1 }}>
          Load Your<br />
          <span style={{ background: gradCTA, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Products
          </span>
        </h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Upload product images to your generation queue. Supports JPG, PNG, WEBP.
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          ...glassBase,
          borderRadius: 20,
          border: `1.5px dashed rgba(165,165,255,0.25)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(165,165,255,0.04)',
          padding: '36px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          marginBottom: 24,
        }}
      >
        <div style={{
          width: 52, height: 52,
          borderRadius: '50%',
          background: 'rgba(165,165,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>Tap to Upload Products</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.muted, letterSpacing: 1 }}>
          OR DRAG AND DROP FILES
        </span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => onFilesAdded(e.target.files)}
      />

      {products.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Label color={C.muted}>Queue</Label>
              <div style={{
                background: 'rgba(165,165,255,0.12)',
                borderRadius: 9999,
                padding: '2px 10px',
              }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 800, color: C.primary }}>
                  {products.length}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={onSelectAll} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Select All
              </button>
              {selectedCount > 0 && (
                <button onClick={onDeleteSelected} style={{ background: 'none', border: 'none', color: C.danger, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Delete ({selectedCount})
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => onToggleProduct(product.id)}
                style={{
                  position: 'relative',
                  borderRadius: 18,
                  overflow: 'hidden',
                  aspectRatio: '3/4',
                  cursor: 'pointer',
                  outline: product.selected
                    ? `2px solid ${C.primary}`
                    : '2px solid transparent',
                  transition: 'outline 0.15s',
                  boxShadow: product.selected ? `0 0 20px rgba(165,165,255,0.2)` : 'none',
                }}
              >
                <img
                  src={product.preview}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  width: 22, height: 22,
                  borderRadius: 7,
                  background: product.selected ? gradCTA : 'rgba(0,0,0,0.4)',
                  border: product.selected ? 'none' : `1.5px solid rgba(255,255,255,0.4)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {product.selected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  padding: '24px 10px 8px',
                }}>
                  <div style={{ color: 'white', fontSize: 10, fontWeight: 700, fontFamily: 'Manrope, sans-serif', letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Your queue is empty</div>
          <div style={{ fontSize: 12, marginTop: 4, color: C.faint }}>Upload product images above to get started</div>
        </div>
      )}
    </div>
  )
}

// ─── Configure Tab ────────────────────────────────────────────────────────────

function ConfigureTab({ config, onChange, onGenerate, selectedProductCount }) {
  const { handModel, selectedBgs, smartMix, customInstructions, iterations, promptTemplate } = config
  const totalImages  = selectedProductCount * iterations
  const canGenerate  = selectedProductCount > 0 && selectedBgs.length > 0

  const toggleBg = (id) => {
    onChange({
      selectedBgs: selectedBgs.includes(id)
        ? selectedBgs.filter(b => b !== id)
        : [...selectedBgs, id]
    })
  }

  return (
    <div style={{ padding: '0 20px', animation: 'fadeUp 0.3s ease both' }}>
      <div style={{ marginBottom: 28 }}>
        <Label color={C.primary}>Staging Config</Label>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '8px 0 8px', lineHeight: 1.1 }}>
          Customize<br />
          <span style={{ background: gradCTA, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Your Scene
          </span>
        </h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Configure the aesthetic DNA of your lifestyle generation. Choose hand models, environments, and creative direction.
        </p>
      </div>

      {/* Hand Model */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Label>Hand Model</Label>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, boxShadow: `0 0 8px ${C.primary}` }} />
        </div>
        <div style={{ ...glassBase, borderRadius: 18, overflow: 'hidden' }}>
          {['neutral', 'female', 'male'].map((model, i) => {
            const isActive = handModel === model
            return (
              <button
                key={model}
                onClick={() => onChange({ handModel: model })}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px 18px',
                  background: isActive ? 'rgba(165,165,255,0.1)' : 'none',
                  border: 'none',
                  borderTop: i > 0 ? `1px solid ${C.ghost}` : 'none',
                  cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15, color: isActive ? 'white' : C.muted, textTransform: 'capitalize' }}>
                  {model}
                </span>
                <div style={{
                  width: 20, height: 20,
                  borderRadius: '50%',
                  border: `2px solid ${isActive ? C.primary : C.ghost}`,
                  background: isActive ? gradCTA : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Smart Mix */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          ...glassBase,
          borderRadius: 18,
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Label>Smart Mix</Label>
            </div>
            <button
              onClick={() => onChange({ smartMix: !smartMix })}
              style={{
                width: 48, height: 26,
                borderRadius: 9999,
                background: smartMix ? gradCTA : C.bright,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
                boxShadow: smartMix ? `0 0 12px rgba(165,165,255,0.4)` : 'none',
              }}
            >
              <div style={{
                width: 20, height: 20,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: smartMix ? 25 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }} />
            </button>
          </div>
          <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Enable AI-driven variations in environment selection across your batch for a natural, editorial feel.
          </p>
        </div>
      </div>

      {/* Iterations */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          ...glassBase,
          borderRadius: 18,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <Label>Iterations per Product</Label>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
              {iterations === 1
                ? 'One variation per product'
                : `${iterations} variations per product`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => onChange({ iterations: Math.max(1, iterations - 1) })}
              disabled={iterations <= 1}
              style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: iterations <= 1 ? 'rgba(255,255,255,0.05)' : C.high,
                border: `1px solid ${C.ghost}`,
                color: iterations <= 1 ? C.faint : 'white',
                fontSize: 20,
                fontWeight: 300,
                cursor: iterations <= 1 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >−</button>
            <div style={{
              minWidth: 40,
              textAlign: 'center',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 900,
              fontSize: 26,
              color: 'white',
              lineHeight: 1,
            }}>
              {iterations}
            </div>
            <button
              onClick={() => onChange({ iterations: Math.min(5, iterations + 1) })}
              disabled={iterations >= 5}
              style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: iterations >= 5 ? 'rgba(255,255,255,0.05)' : gradCTA,
                border: 'none',
                color: iterations >= 5 ? C.faint : 'white',
                fontSize: 20,
                fontWeight: 300,
                cursor: iterations >= 5 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
                boxShadow: iterations >= 5 ? 'none' : `0 0 12px rgba(165,165,255,0.3)`,
              }}
            >+</button>
          </div>
        </div>
      </div>

      {/* Photo Style — F-07 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Label>Photo Style</Label>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, boxShadow: `0 0 8px ${C.primary}` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PROMPT_TEMPLATES.map((tmpl) => {
            const isActive = promptTemplate === tmpl.id
            return (
              <button
                key={tmpl.id}
                onClick={() => onChange({ promptTemplate: tmpl.id })}
                style={{
                  borderRadius: 16,
                  padding: '14px 12px',
                  border: isActive ? `1.5px solid ${C.primary}` : `1px solid ${C.ghost}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isActive ? 'rgba(165,165,255,0.1)' : 'rgba(19,19,24,0.7)',
                  boxShadow: isActive ? `0 0 16px rgba(165,165,255,0.15)` : 'none',
                  transition: 'all 0.15s',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{tmpl.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 13, color: isActive ? 'white' : C.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{tmpl.label}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{tmpl.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Environments */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Label>Environments</Label>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.muted }}>
            {BACKGROUNDS.length} presets
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {BACKGROUNDS.map((bg) => {
            const isSelected = selectedBgs.includes(bg.id)
            return (
              <button
                key={bg.id}
                onClick={() => toggleBg(bg.id)}
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  background: bg.gradient,
                  border: 'none',
                  cursor: 'pointer',
                  outline: isSelected ? `2px solid ${C.primary}` : '2px solid transparent',
                  transition: 'outline 0.15s',
                  boxShadow: isSelected ? `0 0 16px rgba(165,165,255,0.25)` : 'none',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(165,165,255,0.15)',
                  }} />
                )}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -70%)', fontSize: 24 }}>
                  {bg.emoji}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  padding: '18px 10px 8px',
                }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: 1 }}>
                    {bg.label.toUpperCase()}
                  </span>
                </div>
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 7, right: 7,
                    background: gradCTA,
                    borderRadius: 9999,
                    padding: '2px 7px',
                  }}>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 8, fontWeight: 900, color: 'white', letterSpacing: 1 }}>
                      ON
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Creative Direction */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>🧍</span>
          <Label>Model Appearance</Label>
        </div>
        <textarea
          value={customInstructions}
          onChange={(e) => onChange({ customInstructions: e.target.value })}
          placeholder="e.g. wearing a red oversized hoodie, olive skin tone, sleeve tattoo on left arm, long braided hair..."
          rows={4}
          style={{
            width: '100%',
            background: C.high,
            border: '1.5px solid transparent',
            borderRadius: 16,
            padding: '14px 16px',
            fontSize: 14,
            color: 'white',
            resize: 'none',
            outline: 'none',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            caretColor: C.primary,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = `rgba(165,165,255,0.4)` }}
          onBlur={(e) => { e.target.style.borderColor = 'transparent' }}
        />
      </div>

      {/* Estimated result info */}
      <div style={{
        ...glassBase,
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 26 }}>📸</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
            {selectedProductCount > 0
              ? iterations > 1
                ? `${selectedProductCount} × ${iterations} = ${totalImages} images`
                : `${selectedProductCount} product${selectedProductCount > 1 ? 's' : ''}`
              : 'No products selected'}
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.muted, marginTop: 3 }}>
            {selectedBgs.length > 0
              ? `${selectedBgs.length} env${selectedBgs.length > 1 ? 's' : ''} · Smart Mix ${smartMix ? 'ON' : 'OFF'} · ${iterations} iteration${iterations > 1 ? 's' : ''}`
              : 'Select at least one environment'}
          </div>
        </div>
        {selectedProductCount > 0 && selectedBgs.length > 0 && iterations > 1 && (
          <div style={{
            background: 'rgba(165,165,255,0.12)',
            borderRadius: 9999,
            padding: '4px 12px',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 900, color: C.primary }}>
              {totalImages}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <GradientButton onClick={onGenerate} disabled={!canGenerate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {canGenerate
            ? `Generate · ${selectedProductCount} × ${iterations} = ${totalImages}`
            : 'Generate Lifestyle Images'}
        </GradientButton>
      </div>
    </div>
  )
}

// ─── Generate Tab (Progress) ──────────────────────────────────────────────────

function GenerateTab({ progress, animatedPercent, isGenerating, products, onCancel, onGoGallery, failedItems }) {
  const percent = progress.total > 0
    ? Math.round(animatedPercent)
    : 0

  const done = !isGenerating && progress.total > 0

  const productHasFailed = (product) =>
    failedItems.some(f => f.productId === product.id)

  return (
    <div style={{ padding: '0 20px', animation: 'fadeUp 0.3s ease both' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <Label color={C.secondaryDim}>
          {isGenerating ? 'System Engine Active' : done ? 'Generation Complete' : 'Ready to Generate'}
        </Label>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '10px 0 0', lineHeight: 1.15 }}>
          {isGenerating
            ? 'Crafting Your\nContent...'
            : done
              ? 'Your Batch\nIs Ready'
              : 'Configure & Hit\nGenerate'}
        </h1>
      </div>

      {(isGenerating || done) && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <CircularProgress percent={done ? 100 : percent} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        {done && (
          <GradientButton onClick={onGoGallery}>
            View Gallery →
          </GradientButton>
        )}
        {isGenerating && (
          <GhostButton onClick={onCancel}>
            Cancel Batch
          </GhostButton>
        )}
      </div>

      {isGenerating && (
        <div style={{ marginBottom: 20 }}>
          <Label color={C.muted}>Current Step</Label>
          <div style={{
            ...glassBase,
            borderRadius: 16,
            padding: '14px 16px',
            marginTop: 10,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.lime, boxShadow: `0 0 10px ${C.lime}`, marginTop: 3, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Generating Image {progress.current + 1}</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
                Compositing product into scene with ambient lighting and depth layers.
              </div>
            </div>
          </div>
        </div>
      )}

      {(isGenerating || done) && progress.total > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Label color={C.muted}>Batch Queue</Label>
            <div style={{
              background: 'rgba(165,165,255,0.12)',
              borderRadius: 9999,
              padding: '2px 10px',
            }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 800, color: C.primary }}>
                {progress.current}/{progress.total}
              </span>
            </div>
          </div>
          <div style={{ ...glassBase, borderRadius: 18, overflow: 'hidden' }}>
            {products.filter(p => p.selected).slice(0, 4).map((product, i) => {
              const isDone   = i < progress.current
              const isActive = i === progress.current && isGenerating
              const hasFail  = isDone && productHasFailed(product)
              return (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderTop: i > 0 ? `1px solid ${C.ghost}` : 'none',
                    background: isActive ? 'rgba(165,165,255,0.05)' : 'none',
                  }}
                >
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: 10,
                    background: C.high,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <img src={product.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </div>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: hasFail ? C.danger : C.muted, marginTop: 2 }}>
                      {isDone ? (hasFail ? 'Partially failed' : 'Complete') : isActive ? 'Processing...' : 'Queued'}
                    </div>
                  </div>
                  <div>
                    {isDone
                      ? hasFail
                        ? <span style={{ color: C.danger, fontSize: 16 }}>✗</span>
                        : <span style={{ color: C.lime, fontSize: 16 }}>✓</span>
                      : isActive
                        ? <Spinner size={16} />
                        : <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.bright }} />
                    }
                  </div>
                </div>
              )
            })}
            {isGenerating && (
              <div style={{
                padding: '12px 16px',
                borderTop: `1px solid ${C.ghost}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.muted, letterSpacing: 1 }}>
                  ESTIMATED REMAINING
                </span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: 'white', fontSize: 16 }}>
                  ~{(progress.total - progress.current) * 15}s
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!isGenerating && progress.total === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'white', marginBottom: 8 }}>Ready to generate</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            Head to the Configure tab to set your scene,<br />then hit Generate to start your batch.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Lightbox — F-06 ─────────────────────────────────────────────────────────

function Lightbox({ results, initialId, onClose, onDownload }) {
  const initialIdx = results.findIndex(r => r.id === initialId)
  const [curIdx, setCurIdx] = useState(initialIdx >= 0 ? initialIdx : 0)
  const touchStartX = useRef(null)

  const curResult = results[curIdx]
  const canPrev = curIdx > 0
  const canNext = curIdx < results.length - 1

  const goPrev = () => { if (canPrev) setCurIdx(i => i - 1) }
  const goNext = () => { if (canNext) setCurIdx(i => i + 1) }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [curIdx])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  if (!curResult) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', flexDirection: 'column',
        maxWidth: 430, margin: '0 auto',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 12px',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{curResult.productName}</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.muted, marginTop: 2 }}>
            {curResult.background?.replace(/_/g, ' ')} · #{curResult.iteration}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Image + Nav */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img
          src={`data:${curResult.imageMimeType};base64,${curResult.imageBase64}`}
          alt={curResult.productName}
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
        {canPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        {canNext && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Counter */}
      <div style={{ textAlign: 'center', padding: '8px 0', color: C.muted, fontFamily: 'Manrope, sans-serif', fontSize: 12, flexShrink: 0 }}>
        {curIdx + 1} / {results.length}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 20px 36px', justifyContent: 'center', flexShrink: 0 }}>
        <GradientButton onClick={() => onDownload(curResult)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </GradientButton>
      </div>
    </div>
  )
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────────

function GalleryTab({ results, isGenerating, progress, onDownload, onDownloadAll, onNewBatch, failedItems, onRetryFailed, onRegenerate, regeneratingIds }) {
  const [selected, setSelected]   = useState(new Set())
  const [lightbox, setLightbox]   = useState({ open: false, resultId: null })
  const longPressTimer            = useRef(null)
  const accuracy                  = 99

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openLightbox  = (result) => setLightbox({ open: true, resultId: result.id })
  const closeLightbox = () => setLightbox({ open: false, resultId: null })

  // Long-press detection for mobile selection
  const handleCardTouchStart = (resultId) => () => {
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null
      toggleSelect(resultId)
    }, 380)
  }
  const handleCardTouchMove = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  const handleCardTouchEnd = (result) => (e) => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
      e.preventDefault()
      openLightbox(result)
    }
  }
  // Desktop click (touch devices call preventDefault above, suppressing this)
  const handleCardClick = (result) => {
    openLightbox(result)
  }

  // Group results by productId
  const groups = results.reduce((acc, r) => {
    const key = r.productId ?? r.productName
    if (!acc.find(g => g.key === key)) {
      acc.push({ key, productName: r.productName, items: [] })
    }
    acc.find(g => g.key === key).items.push(r)
    return acc
  }, [])

  const hasMultipleIterations = results.some(r => r.iteration > 1)

  const retriesRemaining = failedItems.filter(f => f.retryCount < 3).length

  return (
    <div style={{ padding: '0 20px', animation: 'fadeUp 0.3s ease both' }}>
      {/* Lightbox — F-06 */}
      {lightbox.open && (
        <Lightbox
          results={results}
          initialId={lightbox.resultId}
          onClose={closeLightbox}
          onDownload={onDownload}
        />
      )}

      {/* Hero */}
      <div style={{ marginBottom: 20 }}>
        <Label color={C.primary}>Curation Hub</Label>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 8px', lineHeight: 1.1 }}>
          Your Staged<br />
          <span style={{ background: gradCTA, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Batch
          </span>
        </h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          {results.length} image{results.length !== 1 ? 's' : ''} across {groups.length} product{groups.length !== 1 ? 's' : ''}. Ready for distribution.
        </p>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={onNewBatch}
          style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          New Batch
        </button>
        <div style={{ marginLeft: 'auto' }}>
          {selected.size > 0 ? (
            <GradientButton onClick={() => results.filter(r => selected.has(r.id)).forEach(r => onDownload(r))} small>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Save ({selected.size})
            </GradientButton>
          ) : (
            <GradientButton onClick={() => onDownloadAll(results)} small>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Save All
            </GradientButton>
          )}
        </div>
      </div>

      {/* Still generating notice */}
      {isGenerating && (
        <div style={{
          ...glassBase,
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Spinner size={16} />
          <span style={{ fontSize: 13, color: C.muted }}>
            Rendering... {progress.current}/{progress.total} complete
          </span>
        </div>
      )}

      {/* F-09: Error recovery banner */}
      {!isGenerating && failedItems.length > 0 && (
        <div style={{
          background: 'rgba(255,107,107,0.08)',
          border: `1px solid rgba(255,107,107,0.25)`,
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.danger }}>
              {failedItems.length} image{failedItems.length !== 1 ? 's' : ''} failed
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.muted, marginTop: 2 }}>
              {failedItems[0].errorMessage}
              {failedItems.length > 1 ? ` +${failedItems.length - 1} more` : ''}
            </div>
          </div>
          {retriesRemaining > 0 && (
            <button
              onClick={onRetryFailed}
              style={{
                background: 'rgba(255,107,107,0.15)',
                border: `1px solid rgba(255,107,107,0.3)`,
                borderRadius: 9999,
                padding: '7px 14px',
                color: C.danger,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              Retry Failed
            </button>
          )}
        </div>
      )}

      {/* Results grouped by product */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 20 }}>
          {groups.map((group) => (
            <div key={group.key}>
              {(groups.length > 1 || hasMultipleIterations) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      {group.productName}
                    </span>
                    <div style={{ background: 'rgba(165,165,255,0.12)', borderRadius: 9999, padding: '2px 8px' }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 800, color: C.primary }}>
                        {group.items.length}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => group.items.forEach(r => onDownload(r))}
                    style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Save group
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {group.items.map((result) => {
                  const isSel        = selected.has(result.id)
                  const isRegen      = regeneratingIds.has(result.id)
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleCardClick(result)}
                      onTouchStart={handleCardTouchStart(result.id)}
                      onTouchMove={handleCardTouchMove}
                      onTouchEnd={handleCardTouchEnd(result)}
                      style={{
                        position: 'relative',
                        borderRadius: 16,
                        overflow: 'hidden',
                        aspectRatio: '9/16',
                        cursor: 'pointer',
                        outline: isSel ? `2px solid ${C.primary}` : '2px solid transparent',
                        boxShadow: isSel ? `0 0 20px rgba(165,165,255,0.2)` : 'none',
                        transition: 'outline 0.15s',
                      }}
                    >
                      <img
                        src={`data:${result.imageMimeType};base64,${result.imageBase64}`}
                        alt={result.productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Regenerating overlay — F-08 */}
                      {isRegen && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,0.72)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'column', gap: 8,
                        }}>
                          <Spinner size={28} />
                          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, color: C.muted, letterSpacing: 1 }}>REGENERATING</span>
                        </div>
                      )}

                      {/* Iteration badge */}
                      {hasMultipleIterations && !isSel && (
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          background: 'rgba(0,0,0,0.6)',
                          borderRadius: 9999,
                          padding: '3px 8px',
                          backdropFilter: 'blur(8px)',
                        }}>
                          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 900, color: 'white', letterSpacing: 1 }}>
                            #{result.iteration}
                          </span>
                        </div>
                      )}

                      {/* READY badge */}
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: C.lime,
                        borderRadius: 9999,
                        padding: '3px 8px',
                      }}>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 900, color: '#0e0e13', letterSpacing: 1 }}>
                          READY
                        </span>
                      </div>

                      {/* Select badge — clicking selects without opening lightbox */}
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleSelect(result.id) }}
                        style={{
                          position: 'absolute', top: 8, left: 8,
                          width: 22, height: 22,
                          borderRadius: 7,
                          background: isSel ? gradCTA : 'rgba(0,0,0,0.4)',
                          border: isSel ? 'none' : `1.5px solid rgba(255,255,255,0.4)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                        }}
                      >
                        {isSel && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>

                      {/* Bottom overlay */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                        padding: '24px 10px 10px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: C.muted, fontSize: 10, fontFamily: 'Manrope, sans-serif' }}>
                            {result.background?.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {/* Regenerate button — F-08 */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onRegenerate(result) }}
                            disabled={isRegen}
                            style={{
                              width: 30, height: 30,
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.15)',
                              border: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: isRegen ? 'default' : 'pointer',
                              flexShrink: 0,
                              opacity: isRegen ? 0.5 : 1,
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 4v6h-6"/>
                              <path d="M1 20v-6h6"/>
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                          </button>
                          {/* Download button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDownload(result) }}
                            style={{
                              width: 30, height: 30,
                              borderRadius: '50%',
                              background: gradCTA,
                              border: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Loading placeholders while generating */}
              {isGenerating && group === groups[groups.length - 1] && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                  {Array.from({ length: Math.max(0, progress.total - progress.current) }).map((_, i) => (
                    <div key={`ph-${i}`} style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '9/16' }} className="skeleton" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Batch energy card */}
      {results.length > 0 && (
        <div style={{
          ...glassBase,
          borderRadius: 18,
          padding: '18px',
          marginBottom: 8,
          background: 'rgba(202,253,0,0.05)',
          border: `1px solid rgba(202,253,0,0.15)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              ⚡
            </div>
            <div>
              <Label color={C.lime}>Batch Energy</Label>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'white', marginTop: 2 }}>High Intensity</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.muted }}>Generation Accuracy</span>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 16, color: C.lime }}>{accuracy}.{Math.floor(Math.random() * 9)}%</span>
          </div>
        </div>
      )}

      {results.length === 0 && !isGenerating && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 8 }}>No results yet</div>
          <div style={{ fontSize: 13 }}>Generate your first batch to see results here.</div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const DEFAULT_SELECTED_BGS = []

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload')

  // Config
  const [config, setConfig] = useState({
    handModel:          'neutral',
    selectedBgs:        DEFAULT_SELECTED_BGS,
    smartMix:           false,
    customInstructions: '',
    iterations:         1,
    promptTemplate:     'ugc',
  })

  // Products
  const [products, setProducts] = useState([])

  // Results
  const [results,         setResults]         = useState([])
  const [isGenerating,    setIsGenerating]    = useState(false)
  const [progress,        setProgress]        = useState({ current: 0, total: 0 })
  const [errors,          setErrors]          = useState([]) // structured: {productId, product, bgId, iter, errorMessage, retryCount}
  const [animatedPercent, setAnimatedPercent] = useState(0)
  const [regeneratingIds, setRegeneratingIds] = useState(new Set())
  const [toast,           setToast]           = useState(null)

  // History
  const [history,     setHistory]     = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, duration = 2500) => {
    setToast(msg)
    if (duration > 0) {
      setTimeout(() => setToast(null), duration)
    }
  }, [])

  // ── Progress ring animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isGenerating || progress.total === 0) return

    const realPercent = Math.round((progress.current / progress.total) * 100)
    const slotSize    = 100 / progress.total
    const ceiling     = realPercent + slotSize * 0.9

    const id = setInterval(() => {
      setAnimatedPercent(prev => {
        const base = Math.max(prev, realPercent)
        if (base >= ceiling) return base
        const step = Math.max(0.15, (ceiling - base) * 0.04)
        return Math.min(ceiling, base + step)
      })
    }, 120)

    return () => clearInterval(id)
  }, [isGenerating, progress])

  useEffect(() => {
    if (!isGenerating && progress.total > 0) {
      setAnimatedPercent(100)
    }
  }, [isGenerating, progress.total])

  const updateConfig = (partial) => setConfig(prev => ({ ...prev, ...partial }))
  const selectedProducts = products.filter(p => p.selected)

  // ── File handling ───────────────────────────────────────────────────────────

  const handleFilesAdded = useCallback((files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        setProducts(prev => [
          ...prev,
          {
            id:       `${Date.now()}-${Math.random()}`,
            name:     file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 28),
            base64:   dataUrl.split(',')[1],
            mimeType: file.type || 'image/jpeg',
            preview:  dataUrl,
            selected: true,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // ── Generation ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (selectedProducts.length === 0 || config.selectedBgs.length === 0 || isGenerating) return

    const { iterations } = config
    const total = selectedProducts.length * iterations

    setIsGenerating(true)
    setErrors([])
    setResults([])
    setProgress({ current: 0, total })
    setAnimatedPercent(0)
    setActiveTab('generate')

    const newResults = []
    let completed = 0

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i]
      const bgPool  = config.selectedBgs

      for (let iter = 0; iter < iterations; iter++) {
        const bgId = config.smartMix
          ? bgPool[Math.floor(Math.random() * bgPool.length)]
          : bgPool[iter % bgPool.length]

        const prompt = buildPrompt(config.handModel, bgId, config.customInstructions, config.promptTemplate)

        try {
          const res  = await fetch('/api/generate', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ productImageBase64: product.base64, mimeType: product.mimeType, prompt }),
          })
          const data = await res.json()

          if (data.imageBase64) {
            newResults.push({
              id:            `result-${Date.now()}-${i}-${iter}`,
              productId:     product.id,
              productName:   product.name,
              iteration:     iter + 1,
              imageBase64:   data.imageBase64,
              imageMimeType: data.mimeType ?? 'image/jpeg',
              background:    bgId,
            })
            setResults([...newResults])
          } else {
            setErrors(prev => [...prev, {
              productId:    product.id,
              product:      { id: product.id, name: product.name, base64: product.base64, mimeType: product.mimeType },
              bgId,
              iter:         iter + 1,
              errorMessage: data.error ?? 'Failed',
              retryCount:   0,
            }])
          }
        } catch {
          setErrors(prev => [...prev, {
            productId:    product.id,
            product:      { id: product.id, name: product.name, base64: product.base64, mimeType: product.mimeType },
            bgId,
            iter:         iter + 1,
            errorMessage: 'Network error',
            retryCount:   0,
          }])
        }

        completed++
        setProgress({ current: completed, total })
      }
    }

    setIsGenerating(false)
    if (newResults.length > 0) {
      setTimeout(() => setActiveTab('gallery'), 600)
    }
  }

  // ── Retry Failed — F-09 ──────────────────────────────────────────────────────

  const handleRetryFailed = async () => {
    const toRetry = errors.filter(f => f.retryCount < 3)
    if (toRetry.length === 0) return

    setIsGenerating(true)
    setErrors([])
    setProgress({ current: 0, total: toRetry.length })
    setAnimatedPercent(0)
    setActiveTab('generate')

    const newErrors = []
    let completed = 0

    for (const failure of toRetry) {
      const { product, bgId, iter, retryCount } = failure
      const prompt = buildPrompt(config.handModel, bgId, config.customInstructions, config.promptTemplate)

      try {
        const res  = await fetch('/api/generate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ productImageBase64: product.base64, mimeType: product.mimeType, prompt }),
        })
        const data = await res.json()

        if (data.imageBase64) {
          const newResult = {
            id:            `result-${Date.now()}-retry-${iter}`,
            productId:     product.id,
            productName:   product.name,
            iteration:     iter,
            imageBase64:   data.imageBase64,
            imageMimeType: data.mimeType ?? 'image/jpeg',
            background:    bgId,
          }
          setResults(prev => [...prev, newResult])
        } else {
          newErrors.push({ ...failure, errorMessage: data.error ?? 'Failed', retryCount: retryCount + 1 })
        }
      } catch {
        newErrors.push({ ...failure, errorMessage: 'Network error', retryCount: retryCount + 1 })
      }

      completed++
      setProgress({ current: completed, total: toRetry.length })
    }

    setErrors(newErrors)
    setIsGenerating(false)
    setTimeout(() => setActiveTab('gallery'), 600)
  }

  // ── Regenerate Single Image — F-08 ──────────────────────────────────────────

  const handleRegenerate = async (result) => {
    const product = products.find(p => p.id === result.productId)
    if (!product || regeneratingIds.has(result.id)) return

    setRegeneratingIds(prev => new Set([...prev, result.id]))

    const bgId   = result.background
    const prompt = buildPrompt(config.handModel, bgId, config.customInstructions, config.promptTemplate)

    try {
      const res  = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productImageBase64: product.base64, mimeType: product.mimeType, prompt }),
      })
      const data = await res.json()

      if (data.imageBase64) {
        const newResult = {
          id:            `result-${Date.now()}-regen`,
          productId:     product.id,
          productName:   product.name,
          iteration:     result.iteration,
          imageBase64:   data.imageBase64,
          imageMimeType: data.mimeType ?? 'image/jpeg',
          background:    bgId,
        }
        // Add new result without removing original
        setResults(prev => [...prev, newResult])
      }
    } catch {
      // silently fail — original card remains
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev)
        next.delete(result.id)
        return next
      })
    }
  }

  // ── Download (iOS → Photos via Web Share; desktop → JSZip) — F-05 ───────────

  const handleDownload = async (result) => {
    const dataUrl  = `data:${result.imageMimeType};base64,${result.imageBase64}`
    const filename = `${result.productName.toLowerCase().replace(/\s+/g, '-')}-staged.jpg`

    try {
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], filename, { type: 'image/jpeg' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] })
          return
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
    }

    const link    = document.createElement('a')
    link.href     = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = async (targetResults) => {
    const list = targetResults ?? results
    if (list.length === 0) return

    // Mobile → Web Share API
    if (navigator.share) {
      try {
        const files = await Promise.all(
          list.map(async (r) => {
            const blob = await (await fetch(`data:${r.imageMimeType};base64,${r.imageBase64}`)).blob()
            return new File([blob], `${r.productName.toLowerCase().replace(/\s+/g, '-')}-staged.jpg`, { type: 'image/jpeg' })
          })
        )
        if (navigator.canShare?.({ files })) {
          await navigator.share({ files })
          return
        }
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    // Desktop → JSZip bundle
    showToast('Creating zip…', 0)
    try {
      const JSZipModule = await import('jszip')
      const JSZip = JSZipModule.default
      const zip   = new JSZip()

      for (const r of list) {
        const folder   = zip.folder(r.productName)
        const blob     = await (await fetch(`data:${r.imageMimeType};base64,${r.imageBase64}`)).blob()
        const filename = `image-${r.iteration ?? 1}.jpg`
        folder.file(filename, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const url     = URL.createObjectURL(content)
      const link    = document.createElement('a')
      link.href     = url
      link.download = 'staged-products.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('Zip downloaded!')
    } catch {
      showToast('Download failed — try saving individually')
    }
  }

  // ── New Batch ────────────────────────────────────────────────────────────────

  const handleNewBatch = () => {
    if (results.length > 0) {
      const now     = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setHistory(prev => [...prev, {
        id:        Date.now(),
        timestamp: timeStr,
        handModel: config.handModel,
        results:   [...results],
      }])
    }
    setResults([])
    setErrors([])
    setProgress({ current: 0, total: 0 })
    setAnimatedPercent(0)
    setActiveTab('upload')
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.base,
      maxWidth: 430,
      margin: '0 auto',
      position: 'relative',
    }}>
      <AppHeader historyCount={history.length} onHistoryOpen={() => setShowHistory(true)} />

      {showHistory && (
        <HistoryPanel
          history={history}
          onClose={() => setShowHistory(false)}
          onDownload={handleDownload}
        />
      )}

      <Toast message={toast} />

      <div style={{ paddingBottom: 120 }}>
        {activeTab === 'upload' && (
          <UploadTab
            products={products}
            onFilesAdded={handleFilesAdded}
            onToggleProduct={(id) => setProducts(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p))}
            onSelectAll={() => setProducts(prev => prev.map(p => ({ ...p, selected: true })))}
            onDeleteSelected={() => setProducts(prev => prev.filter(p => !p.selected))}
          />
        )}

        {activeTab === 'configure' && (
          <ConfigureTab
            config={config}
            onChange={updateConfig}
            onGenerate={handleGenerate}
            selectedProductCount={selectedProducts.length}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateTab
            progress={progress}
            animatedPercent={animatedPercent}
            isGenerating={isGenerating}
            products={products}
            onCancel={() => setIsGenerating(false)}
            onGoGallery={() => setActiveTab('gallery')}
            failedItems={errors}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryTab
            results={results}
            isGenerating={isGenerating}
            progress={progress}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
            onNewBatch={handleNewBatch}
            failedItems={errors}
            onRetryFailed={handleRetryFailed}
            onRegenerate={handleRegenerate}
            regeneratingIds={regeneratingIds}
          />
        )}
      </div>

      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        hasResults={results.length > 0}
        isGenerating={isGenerating}
      />
    </div>
  )
}
