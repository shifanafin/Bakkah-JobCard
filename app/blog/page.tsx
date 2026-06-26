import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { ArrowRight, Clock, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Auto Care Blog — Car Detailing Tips & Guides | Bakkah Dubai',
  description:
    'Expert car detailing advice for Dubai & UAE — ceramic coating, paint correction, PPF, RTA inspection prep, and vehicle care tips from the team at Bakkah Premium Auto Care, Al Qusais.',
  keywords: [
    'car detailing blog dubai', 'auto care tips uae', 'ceramic coating guide dubai',
    'car maintenance tips dubai', 'paint protection uae',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    title: 'Auto Care Blog | Bakkah Premium Auto Care Dubai',
    description: 'Expert car detailing tips, guides and advice for UAE vehicle owners.',
    url: '/blog',
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  'Paint Protection': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'Car Detailing': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'Paint Care': 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  'RTA & Registration': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'Car Care Tips': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const [featured, ...rest] = BLOG_POSTS

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <section className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#111113] py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C9A227]">
            Bakkah Auto Care · Knowledge Base
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl">
            Auto Care Blog
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-white/50 max-w-2xl mx-auto">
            Expert guides on car detailing, paint protection, ceramic coating, and vehicle care
            written by our team in Al Qusais, Dubai.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 space-y-12">
        {/* Featured post */}
        <Link href={`/blog/${featured.slug}`} className="group block">
          <article className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111113] overflow-hidden hover:border-[#C9A227]/50 transition-colors duration-200">
            <div className="h-56 w-full bg-gradient-to-br from-[#C9A227]/20 to-[#d4b22e]/5 flex items-center justify-center">
              <span className="text-6xl">🚗</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_COLORS[featured.category] ?? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/50'}`}>
                  <Tag className="h-3 w-3" />{featured.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/30">
                  <Clock className="h-3 w-3" />{featured.readTime}
                </span>
                <span className="text-xs text-gray-400 dark:text-white/30">{formatDate(featured.publishedAt)}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#C9A227] transition-colors md:text-2xl leading-snug">
                {featured.title}
              </h2>
              <p className="mt-3 text-gray-500 dark:text-white/50 leading-relaxed line-clamp-3">
                {featured.excerpt}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C9A227] group-hover:gap-2.5 transition-all">
                Read article <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </article>
        </Link>

        {/* Rest of posts */}
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <article className="h-full rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111113] overflow-hidden hover:border-[#C9A227]/50 transition-colors duration-200 flex flex-col">
                <div className="h-36 w-full bg-gradient-to-br from-[#C9A227]/10 to-[#d4b22e]/5 flex items-center justify-center shrink-0">
                  <span className="text-4xl">
                    {post.category === 'RTA & Registration' ? '📋'
                      : post.category === 'Paint Care' ? '✨'
                      : post.category === 'Car Care Tips' ? '🛠️'
                      : post.category === 'Car Detailing' ? '💧'
                      : '🛡️'}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/50'}`}>
                      {post.category}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-white/30">{post.readTime}</span>
                  </div>
                  <h2 className="font-bold text-gray-900 dark:text-white group-hover:text-[#C9A227] transition-colors leading-snug flex-1">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-white/40 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#C9A227] group-hover:gap-2 transition-all">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/[0.04] p-8 text-center space-y-4">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            Ready to give your car the care it deserves?
          </p>
          <p className="text-sm text-gray-500 dark:text-white/50">
            Bakkah Premium Auto Care · Al Qusais Industrial Area, Dubai · Open Mon–Sat 8AM–8PM
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/971545886999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#d4b22e] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity"
            >
              Book on WhatsApp
            </a>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/[0.1] px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-white hover:border-[#C9A227]/50 transition-colors"
            >
              Track My Car
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
