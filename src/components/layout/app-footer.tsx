'use client'

import { ShieldCheck, Stethoscope, ExternalLink } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type Section } from '@/lib/store'

const footerLinks = [
  { label: 'Privacy Policy', section: 'consent' as Section },
  { label: 'Terms of Service', section: 'knowledge' as Section },
  { label: 'Safety Disclaimer', section: 'safety' as Section },
  { label: 'CDSCO Registry', href: 'https://cdsco.gov.in', external: true },
]

export function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-background" role="contentinfo">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Branding */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span className="font-semibold text-foreground">MedGovern AI</span>
            <span>v5.0</span>
            <Separator orientation="vertical" className="h-3" />
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-teal-600" />
              Clinician-Governed
            </span>
            <Separator orientation="vertical" className="h-3 hidden sm:block" />
            <span className="hidden sm:inline">CDSCO Integrated</span>
            <Separator orientation="vertical" className="h-3 hidden sm:block" />
            <span className="hidden sm:inline">3 Care Modalities</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-3" aria-label="Footer navigation">
            {footerLinks.map((link, i) => (
              <span key={link.label} className="flex items-center gap-3">
                {i > 0 && <Separator orientation="vertical" className="h-3" />}
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5"
                  >
                    {link.label}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => useAppStore.getState().setActiveSection(link.section!)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5"
                  >
                    {link.label}
                  </button>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Safety Disclaimer */}
        <p className="mt-2 text-[10px] text-muted-foreground text-center sm:text-left leading-relaxed">
          ⚠️ Safety Disclaimer: This platform provides clinical decision support only. All outputs must be reviewed and approved by a qualified healthcare professional before any clinical action. AI-generated content is governed by clinician oversight and patient consent policies.
        </p>
      </div>
    </footer>
  )
}
