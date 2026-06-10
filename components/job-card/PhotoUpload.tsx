'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useCloudinaryUpload } from '@/lib/hooks/use-cloudinary'
import { addPhoto, deletePhoto } from '@/lib/queries'
import { PHOTO_CATEGORY_LABEL, type JobCardPhoto, type PhotoCategory } from '@/types'
import { Camera, Trash2, Loader2, ImagePlus, X, ChevronDown, ZoomIn } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const CATEGORIES: { value: PhotoCategory; label: string; emoji: string }[] = [
  { value: 'exterior_front', label: 'Exterior Front', emoji: '🚗' },
  { value: 'exterior_rear', label: 'Exterior Rear', emoji: '🚙' },
  { value: 'exterior_left', label: 'Exterior Left', emoji: '🚘' },
  { value: 'exterior_right', label: 'Exterior Right', emoji: '🚘' },
  { value: 'interior', label: 'Interior', emoji: '🪑' },
  { value: 'engine_bay', label: 'Engine Bay', emoji: '⚙️' },
  { value: 'damage', label: 'Damage', emoji: '⚠️' },
  { value: 'before_work', label: 'Before Work', emoji: '📸' },
  { value: 'after_work', label: 'After Work', emoji: '✅' },
  { value: 'other', label: 'Other', emoji: '📷' },
]

export default function PhotoUpload({ jobCardId, photos, onPhotosChange }: {
  jobCardId: string; photos: JobCardPhoto[]; onPhotosChange: (p: JobCardPhoto[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const { uploading, progress, uploadMultiple } = useCloudinaryUpload()

  useEffect(() => {
    if (cameraRef.current) cameraRef.current.setAttribute('capture', 'environment')
  }, [])
  const [category, setCategory] = useState<PhotoCategory>('exterior_front')
  const [caption, setCaption] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<JobCardPhoto | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      const results = await uploadMultiple(Array.from(files), `bakkah/job-cards/${jobCardId}`)
      const newPhotos: JobCardPhoto[] = []
      for (const r of results) {
        const p = await addPhoto({ job_card_id: jobCardId, cloudinary_url: r.url, cloudinary_id: r.public_id, category, caption: caption || undefined })
        newPhotos.push(p)
      }
      onPhotosChange([...photos, ...newPhotos])
      setCaption('')
      toast.success(`${results.length} photo${results.length !== 1 ? 's' : ''} uploaded`)
    } catch { toast.error('Upload failed') }
  }, [jobCardId, category, caption, photos, onPhotosChange, uploadMultiple])

  async function handleDelete(photo: JobCardPhoto) {
    setDeletingId(photo.id)
    try {
      await deletePhoto(photo.id, photo.cloudinary_id)
      onPhotosChange(photos.filter(p => p.id !== photo.id))
      toast.success('Photo deleted')
    } catch { toast.error('Delete failed') }
    finally { setDeletingId(null) }
  }

  const grouped = CATEGORIES.reduce<Record<string, JobCardPhoto[]>>((acc, cat) => {
    const cp = photos.filter(p => p.category === cat.value)
    if (cp.length) acc[cat.value] = cp
    return acc
  }, {})

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Vehicle Photos</h3>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/40">{photos.length} photos</span>
      </div>

      {/* Upload controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <div className="relative">
            <select value={category} onChange={e => setCategory(e.target.value as PhotoCategory)} className="input-base appearance-none pr-8">
              {CATEGORIES?.map(c => <option key={c.value} value={c.value} className="bg-zinc-900">{c.emoji} {c.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          </div>
        </div>
        <div>
          <label className="label">Caption (optional)</label>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Scratch on rear bumper" className="input-base" />
        </div>
      </div>



      {/* Upload + Camera buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-lg border  bg-white/[0.03] py-2.5 text-sm  transition border-brand/30 text-brand">
          <ImagePlus className="h-4 w-4" /> Upload Photos
        </button>
        <button type="button" onClick={() => cameraRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-lg border  bg-white/[0.03] py-2.5 text-sm transition border-brand/30 text-brand">
          <Camera className="h-4 w-4" /> Take Photo
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      <input ref={cameraRef} type="file" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />

      {/* Gallery */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-5">
          {CATEGORIES.filter(c => grouped[c.value]).map(cat => (
            <div key={cat.value}>
              <h4 className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {cat.emoji} {cat.label}
                <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5">{grouped[cat.value].length}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {grouped[cat.value].map(photo => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-surface-800 aspect-[4/3]">
                    <img src={photo.cloudinary_url} alt={photo.caption ?? cat.label}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => setLightbox(photo)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                        <ZoomIn className="h-4 w-4 text-white" />
                      </button>
                      <button onClick={() => handleDelete(photo)} disabled={deletingId === photo.id} className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40">
                        {deletingId === photo.id ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Trash2 className="h-4 w-4 text-white" />}
                      </button>
                    </div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                        <p className="text-[10px] text-white/70 truncate">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-center text-sm text-white/20 py-4">No photos yet. Upload vehicle photos above.</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
          <div onClick={e => e.stopPropagation()} className="max-h-full max-w-4xl">
            <img src={lightbox.cloudinary_url} alt={lightbox.caption ?? ''} className="max-h-[85vh] rounded-xl object-contain" />
            {lightbox.caption && <p className="mt-3 text-center text-sm text-white/50">{lightbox.caption}</p>}
            <p className="mt-1 text-center text-xs text-white/25">{PHOTO_CATEGORY_LABEL[lightbox.category]}</p>
          </div>
        </div>
      )}
    </div>
  )
}
