interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

// Organization + WebSite for homepage
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WDS - Williams Delivery Service",
    "url": "https://wds.com.gh",
    "logo": "https://wds.com.gh/icon-512.png",
    "description": "Accra's on-demand delivery platform for anything — food, parcels, groceries, medicine, documents, errands — with 24+ riders, live tracking, and Ghana payments.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Accra",
      "addressRegion": "Greater Accra",
      "addressCountry": "GH"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+233-244-000-000",
      "contactType": "customer service",
      "areaServed": "GH",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://wds.com.gh"
    ]
  }
  return <JsonLd data={data} />
}

export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "WDS - Williams Delivery Service",
    "url": "https://wds.com.gh",
    "description": "Deliver anything in Accra in minutes. Food, parcels, groceries, medicine, documents. Real riders, live tracking, MoMo, Card, Cash.",
    "publisher": {
      "@type": "Organization",
      "name": "WDS",
      "logo": {
        "@type": "ImageObject",
        "url": "https://wds.com.gh/icon-512.png"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://wds.com.gh/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  return <JsonLd data={data} />
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }
  return <JsonLd data={data} />
}

export function ServiceJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "On-demand delivery",
    "provider": {
      "@type": "Organization",
      "name": "WDS - Williams Delivery Service"
    },
    "areaServed": {
      "@type": "City",
      "name": "Accra"
    },
    "description": "Deliver anything in Accra in minutes - food, parcels, groceries, medicine, documents, errands. 24 riders, live tracking, MoMo payments.",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GHS",
      "price": "15",
      "description": "Base delivery fee GHS 15 + GHS 2.5 per km + package fee"
    }
  }
  return <JsonLd data={data} />
}
