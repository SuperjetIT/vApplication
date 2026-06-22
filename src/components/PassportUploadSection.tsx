import { useCallback, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PassportData } from '../utils/passportOCR'

const DEFAULT_ACCENT = '#2563eb'
const DEFAULT_GREEN = '#22c55e'

function PassportDocIcon({ size = 20, color = DEFAULT_ACCENT }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="2" width="18" height="20" rx="2" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M6 21v-1a6 6 0 0 1 12 0v1" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function PassportScanKeyframes() {
  return (
    <style>{`
      @keyframes scanLine {
        0% { top: 0%; }
        100% { top: 100%; }
      }
      @keyframes blink {
        0%, 80%, 100% { opacity: 0.2; }
        40% { opacity: 1; }
      }
      .passport-scan-line {
        background: linear-gradient(90deg, transparent, var(--passport-scan-accent, #2563eb), transparent);
        box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
        animation: scanLine 1.5s ease-in-out infinite alternate;
      }
      .passport-scan-dot {
        animation: blink 1.4s infinite;
      }
    `}</style>
  )
}

export function PassportUploadSection({
  isScanning,
  scanProgress,
  scanResult,
  scannedData,
  previewUrl,
  isPdf,
  onUpload,
  onRescan,
  onTryAgain,
  onFillManually,
  accentColor = DEFAULT_ACCENT,
  greenColor = DEFAULT_GREEN,
}: {
  isScanning: boolean
  scanProgress: number
  scanResult: 'success' | 'failed' | 'pdf' | null
  scannedData: PassportData | null
  previewUrl: string | null
  isPdf: boolean
  onUpload: (file: File) => void
  onRescan: () => void
  onTryAgain: () => void
  onFillManually: () => void
  accentColor?: string
  greenColor?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (file) onUpload(file)
  }

  const handleRescan = () => {
    onRescan()
    window.setTimeout(() => inputRef.current?.click(), 0)
  }

  const handleTryAgain = () => {
    onTryAgain()
    window.setTimeout(() => inputRef.current?.click(), 0)
  }

  const cornerStyle = (position: 'tl' | 'tr' | 'bl' | 'br'): CSSProperties => {
    const base: CSSProperties = {
      position: 'absolute',
      width: 16,
      height: 16,
      borderColor: accentColor,
      borderStyle: 'solid',
      borderWidth: 0,
    }
    if (position === 'tl') return { ...base, top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }
    if (position === 'tr') return { ...base, top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }
    if (position === 'bl') return { ...base, bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }
    return { ...base, bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }
  }

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '2px dashed #bfdbfe',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        ['--passport-scan-accent' as string]: accentColor,
      }}
    >
      <PassportScanKeyframes />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <PassportDocIcon color={accentColor} />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1e3a5f' }}>Upload Passport for Auto-fill</span>
      </div>
      <p style={{ margin: '4px 0 16px', color: '#64748b', fontSize: 12 }}>
        Upload passport image or PDF — details will be filled automatically
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {isScanning && (
        <div>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, height: 80 }}>
            {previewUrl && !isPdf ? (
              <img src={previewUrl} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 80, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, fontWeight: 700, fontSize: 14 }}>
                PDF
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(37,99,235,0.06)', borderRadius: 8, overflow: 'hidden' }}>
              <div className="passport-scan-line" style={{ position: 'absolute', left: 0, right: 0, height: 2 }} />
              <div style={cornerStyle('tl')} />
              <div style={cornerStyle('tr')} />
              <div style={cornerStyle('bl')} />
              <div style={cornerStyle('br')} />
            </div>
          </div>
          <div style={{ background: '#dbeafe', borderRadius: 40, height: 6, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ background: accentColor, height: '100%', borderRadius: 40, width: `${scanProgress}%`, transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ color: accentColor, fontSize: 13, textAlign: 'center', marginTop: 8, fontWeight: 500 }}>
            Reading passport... {scanProgress}%
          </p>
          <p style={{ color: accentColor, fontSize: 13, textAlign: 'center', margin: '4px 0 0', fontWeight: 500 }}>
            Scanning
            <span className="passport-scan-dot" style={{ animationDelay: '0s' }}>.</span>
            <span className="passport-scan-dot" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="passport-scan-dot" style={{ animationDelay: '0.4s' }}>.</span>
          </p>
        </div>
      )}

      {!isScanning && scanResult === 'success' && scannedData && (
        <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: greenColor, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>✓</span>
            <span style={{ fontWeight: 700, color: greenColor, fontSize: 14 }}>Passport scanned successfully!</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {scannedData.firstName || scannedData.lastName ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}><strong>Name:</strong> {scannedData.firstName} {scannedData.lastName}</p>
            ) : null}
            {scannedData.passportNumber ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}><strong>Passport No:</strong> {scannedData.passportNumber}</p>
            ) : null}
            {scannedData.dateOfBirth ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}><strong>Date of Birth:</strong> {scannedData.dateOfBirth}</p>
            ) : null}
            {scannedData.expiryDate ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}><strong>Expiry:</strong> {scannedData.expiryDate}</p>
            ) : null}
            {scannedData.nationality ? (
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}><strong>Nationality:</strong> {scannedData.nationality}</p>
            ) : null}
          </div>
          <p style={{ color: '#16a34a', fontSize: 12, marginTop: 8, marginBottom: 8 }}>✓ All fields filled below — you can edit any detail</p>
          <p style={{ color: '#16a34a', fontSize: 12, margin: '0 0 8px' }}>✓ Passport file saved — no need to upload again on the Documents step</p>
          <button type="button" onClick={handleRescan} style={{ border: 'none', background: 'none', color: accentColor, fontSize: 12, cursor: 'pointer', padding: 0 }}>Re-scan</button>
        </div>
      )}

      {!isScanning && scanResult === 'pdf' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 16, color: '#92400e' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14 }}>📄 PDF uploaded successfully</p>
          <p style={{ margin: '0 0 6px', fontSize: 12 }}>PDF files cannot be auto-scanned. Please fill details manually below.</p>
          <p style={{ margin: 0, fontSize: 12 }}>Your passport PDF is saved and will be submitted with your application ✓</p>
          <button type="button" onClick={handleRescan} style={{ border: 'none', background: 'none', color: accentColor, fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 10 }}>Upload a different file</button>
        </div>
      )}

      {!isScanning && scanResult === 'failed' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: 14 }}>⚠ Could not read passport clearly</p>
          <p style={{ margin: '4px 0 12px', color: '#92400e', fontSize: 12 }}>Tips: ensure good lighting, all 4 corners visible, no glare</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button type="button" onClick={handleTryAgain} style={{ border: 'none', background: 'none', color: accentColor, fontSize: 12, cursor: 'pointer', padding: 0 }}>Try again</button>
            <button type="button" onClick={onFillManually} style={{ border: 'none', background: 'none', color: accentColor, fontSize: 12, cursor: 'pointer', padding: 0 }}>Fill manually</button>
          </div>
        </div>
      )}

      {!isScanning && scanResult !== 'success' && scanResult !== 'failed' && scanResult !== 'pdf' && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files?.[0])
          }}
          style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', border: '1px dashed #bfdbfe' }}
        >
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" aria-hidden style={{ margin: '0 auto' }}>
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 20h16" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ margin: '8px 0 0', fontWeight: 700, color: accentColor, fontSize: 14 }}>Click to upload passport</p>
          <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: 12 }}>JPG, PNG or PDF — Max 15MB</p>
        </div>
      )}

      <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
        Prefer to fill manually? Skip upload and complete the form below.
      </p>
    </div>
  )
}

export function usePassportScanState() {
  const [isScanning, setIsScanning] = useState<Record<number, boolean>>({})
  const [scanProgress, setScanProgress] = useState<Record<number, number>>({})
  const [scanResult, setScanResult] = useState<Record<number, 'success' | 'failed' | 'pdf' | null>>({})
  const [scannedDataByIndex, setScannedDataByIndex] = useState<Record<number, PassportData>>({})
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({})
  const [previewIsPdf, setPreviewIsPdf] = useState<Record<number, boolean>>({})
  const [autoFilledFields, setAutoFilledFields] = useState<Record<number, string[]>>({})

  const resetScanState = useCallback((index: number) => {
    setIsScanning((prev) => ({ ...prev, [index]: false }))
    setScanProgress((prev) => ({ ...prev, [index]: 0 }))
    setScanResult((prev) => ({ ...prev, [index]: null }))
    setScannedDataByIndex((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setAutoFilledFields((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setPreviewUrls((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index])
      const next = { ...prev }
      delete next[index]
      return next
    })
    setPreviewIsPdf((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }, [])

  return {
    isScanning,
    setIsScanning,
    scanProgress,
    setScanProgress,
    scanResult,
    setScanResult,
    scannedDataByIndex,
    setScannedDataByIndex,
    previewUrls,
    setPreviewUrls,
    previewIsPdf,
    setPreviewIsPdf,
    autoFilledFields,
    setAutoFilledFields,
    resetScanState,
  }
}
