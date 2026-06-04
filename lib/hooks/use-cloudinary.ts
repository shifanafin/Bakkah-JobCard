'use client'
import { useState, useCallback } from 'react'

interface UploadResult { url: string; public_id: string }

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadPhoto = useCallback(async (file: File, folder = 'autoedge/job-cards'): Promise<UploadResult> => {
    setUploading(true)
    setProgress(10)
    try {
      const sign = await fetch('/api/cloudinary/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      })
      if (!sign.ok) throw new Error('Signature failed')
      const { signature, timestamp, api_key, cloud_name } = await sign.json()
      setProgress(30)

      const fd = new FormData()
      fd.append('file', file)
      fd.append('signature', signature)
      fd.append('timestamp', timestamp)
      fd.append('api_key', api_key)
      fd.append('folder', folder)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setProgress(100)
      return { url: data.secure_url, public_id: data.public_id }
    } finally {
      setUploading(false)
    }
  }, [])

  const uploadMultiple = useCallback(async (files: File[], folder?: string): Promise<UploadResult[]> => {
    setUploading(true)
    const results: UploadResult[] = []
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round(((i) / files.length) * 100))
      results.push(await uploadPhoto(files[i], folder))
    }
    setUploading(false)
    setProgress(100)
    return results
  }, [uploadPhoto])

  return { uploading, progress, uploadPhoto, uploadMultiple }
}
