import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BLOG_POSTS, getPostBySlug, getAllSlugs } from '@/lib/blog-posts'
import { ArrowLeft, Clock, Tag, ChevronRight } from 'lucide-react'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: ['Bakkah Premium Auto Care'],
      tags: post.keywords,
    },
    other: {
      'article:publisher': base,
      'article:section': post.category,
    },
  }
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

function renderBody(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />

    // Table rows
    if (line.startsWith('|')) {
      return null // handled separately below
    }

    // Heading prefix from bold lines that act as sub-sections
    if (line.startsWith('**') && line.endsWith('**')) {
      const content = line.slice(2, -2)
      return <p key={i} className="mt-5 mb-1 font-bold text-gray-900 dark:text-white">{content}</p>
    }

    // Bullet list items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.slice(2)
      return (
        <li key={i} className="ml-4 text-gray-600 dark:text-white/70 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(content) }}
        />
      )
    }

    // Checklist items
    if (line.startsWith('- [ ] ')) {
      return (
        <li key={i} className="ml-4 flex items-start gap-2 text-gray-600 dark:text-white/70 leading-relaxed">
          <span className="mt-1 h-4 w-4 shrink-0 rounded border border-gray-300 dark:border-white/20" />
          <span dangerouslySetInnerHTML={{ __html: renderInline(line.slice(6)) }} />
        </li>
      )
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '')
      return (
        <li key={i} className="ml-4 list-decimal text-gray-600 dark:text-white/70 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(content) }}
        />
      )
    }

    return (
      <p key={i} className="text-gray-600 dark:text-white/70 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderInline(line) }}
      />
    )
  })
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-gray-100 dark:bg-white/10 px-1 py-0.5 text-xs font-mono">$1</code>')
}

function renderTable(block: string) {
  const rows = block.split('\n').filter((r) => r.trim().startsWith('|'))
  if (rows.length < 2) return null
  const headers = rows[0].split('|').filter(Boolean).map((h) => h.trim())
  const dataRows = rows.slice(2).map((r) => r.split('|').filter(Boolean).map((c) => c.trim()))
  return (
    <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-white/[0.08]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-white/70 text-xs uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
          {dataRows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-gray-600 dark:text-white/60" dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionBody({ body }: { body: string }) {
  const parts = body.split(/(\|[^\n]+\n(?:\|[^\n]+\n?)+)/)
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.trim().startsWith('|')) return <div key={i}>{renderTable(part)}</div>
        return <div key={i} className="space-y-2">{renderBody(part)}</div>
      })}
    </div>
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Bakkah Premium Auto Care',
      url: base,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bakkah Premium Auto Care',
      logo: { '@type': 'ImageObject', url: `${base}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}/blog/${post.slug}` },
    keywords: post.keywords.join(', '),
    articleSection: post.category,
  }

  const faqLd = post.faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }
    : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <main className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {/* Back nav */}
        <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#111113] px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/40 hover:text-[#C9A227] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Blog
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#111113] px-4 py-12">
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
              <Link href="/" className="hover:text-[#C9A227] transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/blog" className="hover:text-[#C9A227] transition-colors">Blog</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-600 dark:text-white/50 truncate max-w-[200px]">{post.category}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                <Tag className="h-3 w-3" />{post.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/30">
                <Clock className="h-3 w-3" />{post.readTime}
              </span>
              <span className="text-xs text-gray-400 dark:text-white/30">
                {formatDate(post.publishedAt)}
              </span>
            </div>

            <h1 className="text-2xl font-bold leading-snug text-gray-900 dark:text-white md:text-3xl lg:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-gray-500 dark:text-white/50 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="mt-6 flex items-center gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A227] to-[#d4b22e]">
                <span className="text-xs font-bold text-black">B</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Bakkah Premium Auto Care</p>
                <p className="text-xs text-gray-400 dark:text-white/30">Al Qusais, Dubai — Est. 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Article body */}
        <article className="mx-auto max-w-3xl px-4 py-12 space-y-10">
          {post.sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
                {section.heading}
              </h2>
              <SectionBody body={section.body} />
            </section>
          ))}

          {/* FAQ */}
          {post.faq && post.faq.length > 0 && (
            <section>
              <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {post.faq.map(({ q, a }, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111113] p-5">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">{q}</p>
                    <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/[0.04] p-8 space-y-4">
            <p className="text-base font-bold text-gray-900 dark:text-white">
              Need professional car care in Dubai?
            </p>
            <p className="text-sm text-gray-500 dark:text-white/50">
              Bakkah Premium Auto Care · Al Qusais Industrial Area, Dubai<br />
              Open Mon–Sat 8AM–8PM · Sun 9AM–5PM · +971 54 588 6999
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://wa.me/971545886999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#d4b22e] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity"
              >
                Book on WhatsApp
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/[0.1] px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-white hover:border-[#C9A227]/50 transition-colors"
              >
                View Services
              </Link>
            </div>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section>
              <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">
                More from the Blog
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((rp) => (
                  <Link key={rp.slug} href={`/blog/${rp.slug}`} className="group block rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111113] p-5 hover:border-[#C9A227]/50 transition-colors">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[rp.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {rp.category}
                    </span>
                    <p className="mt-2 font-semibold text-sm text-gray-800 dark:text-white group-hover:text-[#C9A227] transition-colors leading-snug">
                      {rp.title}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#C9A227]">
                      Read <ArrowLeft className="h-3 w-3 rotate-180" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </>
  )
}
