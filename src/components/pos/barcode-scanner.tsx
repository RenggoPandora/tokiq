import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (barcode: string) => void
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!open) {
      stopScanner()
      return
    }
    startScanner()
    return () => stopScanner()
  }, [open])

  async function startScanner() {
    setError(null)
    setScanning(true)
    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      if (devices.length === 0) {
        setError('Tidak ada kamera yang tersedia.')
        setScanning(false)
        return
      }

      // Prefer back camera
      const backCamera = devices.find(
        (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
      )
      const deviceId = backCamera?.deviceId ?? devices[0].deviceId

      if (!videoRef.current) return

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const barcode = result.getText()
            onScan(barcode)
            onOpenChange(false)
          }
          if (err && !(err.message?.includes('No MultiFormat'))) {
            // Suppress "no barcode found" errors — they fire every frame
          }
        }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengakses kamera'
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Izin kamera ditolak. Aktifkan izin kamera di browser.')
      } else {
        setError(`Kamera error: ${msg}`)
      }
      setScanning(false)
    }
  }

  function stopScanner() {
    if (readerRef.current) {
      try {
        // @zxing/browser v0.1.x — stop all streams on the video element
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          stream.getTracks().forEach((t) => t.stop())
          videoRef.current.srcObject = null
        }
      } catch {
        // ignore cleanup errors
      }
      readerRef.current = null
    }
    setScanning(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopScanner(); onOpenChange(v) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={startScanner}>
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/60 rounded-lg relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
                  {/* Scan line animation */}
                  {scanning && (
                    <div className="absolute left-1 right-1 h-0.5 bg-green-400 animate-bounce top-1/2" />
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Arahkan kamera ke barcode produk. Scanner akan otomatis mendeteksi.
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => { stopScanner(); onOpenChange(false) }}
          >
            <X className="mr-2 h-4 w-4" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
