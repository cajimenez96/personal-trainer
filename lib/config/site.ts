import siteConfigJson from "@/config/site.json"
import type { Metadata } from "next"

export interface SiteTrainerConfig {
  name: string
  role: string
  headline: string
  tagline: string
  contactPhone?: string
  email?: string
}

export interface SiteBrandingConfig {
  logoNavbar: string
  logoHome: string
  favicon: string
}

export interface SiteSeoConfig {
  titleTemplate: string
  defaultTitle: string
  description: string
  keywords: string[]
  locale: string
}

export interface SiteConfig {
  name: string
  shortName: string
  title: string
  description: string
  trainer: SiteTrainerConfig
  branding: SiteBrandingConfig
  seo: SiteSeoConfig
}

export const siteConfig: SiteConfig = siteConfigJson

export function generateSiteMetadata(custom?: Partial<Metadata>): Metadata {
  return {
    title: {
      default: siteConfig.seo.defaultTitle,
      template: siteConfig.seo.titleTemplate,
    },
    description: siteConfig.seo.description,
    keywords: siteConfig.seo.keywords,
    icons: {
      icon: siteConfig.branding.favicon,
    },
    openGraph: {
      title: siteConfig.seo.defaultTitle,
      description: siteConfig.seo.description,
      locale: siteConfig.seo.locale,
      type: "website",
      siteName: siteConfig.name,
    },
    ...custom,
  }
}
