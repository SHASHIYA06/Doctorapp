/**
 * Design System - Doctor App (Healthcare SaaS Dashboard)
 * Generated from ui-ux-pro-max Design Intelligence
 * 
 * Style: Neumorphism (Soft UI)
 * Pattern: Dashboard + Data-driven
 * Variance: 7/10 (Modern), Motion: 6/10 (Standard), Density: 8/10 (Dashboard)
 */

export const designSystem = {
  // Color Palette - Calm Cyan + Health Green
  colors: {
    primary: '#0891B2',      // Cyan - Primary brand
    onPrimary: '#000000',    // Dark text on primary
    secondary: '#22D3EE',    // Light cyan - Secondary
    onSecondary: '#0F172A',  // Dark text on secondary
    accent: '#059669',       // Green - Health/CTA
    onAccent: '#000000',     // Dark text on accent
    background: '#ECFEFF',   // Light cyan background
    foreground: '#164E63',   // Dark cyan foreground
    card: '#FFFFFF',         // White cards
    cardForeground: '#164E63', // Dark text on cards
    muted: '#E8F1F6',        // Light blue-gray
    mutedForeground: '#475569', // Gray text
    border: '#A5F3FC',       // Light cyan borders
    destructive: '#DC2626',  // Red for errors
    onDestructive: '#FFFFFF', // White text on destructive
    ring: '#0891B2',         // Focus ring
    success: '#10B981',      // Green for success
    warning: '#F59E0B',      // Amber for warnings
    info: '#3B82F6',         // Blue for info
  },

  // Typography - Figtree + Noto Sans
  typography: {
    headingFamily: 'Figtree, system-ui, sans-serif',
    bodyFamily: 'Noto Sans, system-ui, sans-serif',
    
    // Heading Styles
    h1: {
      fontSize: '2.25rem',     // 36px
      lineHeight: '2.5rem',    // 40px
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '1.875rem',    // 30px
      lineHeight: '2.25rem',   // 36px
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',      // 24px
      lineHeight: '2rem',      // 32px
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.25rem',     // 20px
      lineHeight: '1.75rem',   // 28px
      fontWeight: 600,
    },

    // Body Styles
    bodyLarge: {
      fontSize: '1.125rem',    // 18px
      lineHeight: '1.75rem',   // 28px
      fontWeight: 400,
    },
    bodyNormal: {
      fontSize: '1rem',        // 16px
      lineHeight: '1.5rem',    // 24px
      fontWeight: 400,
    },
    bodySmall: {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.25rem',   // 20px
      fontWeight: 400,
    },
    bodyExtraSmall: {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1rem',      // 16px
      fontWeight: 400,
    },

    // Label Styles
    labelLarge: {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.25rem',   // 20px
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    labelNormal: {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1rem',      // 16px
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },

  // Spacing Scale - Dense Dashboard (8/10)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
  },

  // Border Radius - Neumorphism (12-16px)
  borderRadius: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',  // Circular
  },

  // Shadows - Neumorphism Soft UI
  shadows: {
    // Embossed/Soft shadows
    soft: {
      light: '-5px -5px 15px rgba(255, 255, 255, 0.7), 5px 5px 15px rgba(0, 0, 0, 0.05)',
      medium: '-8px -8px 20px rgba(255, 255, 255, 0.8), 8px 8px 20px rgba(0, 0, 0, 0.08)',
      dark: '-10px -10px 25px rgba(255, 255, 255, 0.9), 10px 10px 25px rgba(0, 0, 0, 0.1)',
    },
    // Inner shadows
    inset: 'inset -5px -5px 15px rgba(255, 255, 255, 0.5), inset 5px 5px 15px rgba(0, 0, 0, 0.03)',
    // Elevation shadows (for cards/panels)
    elevation: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    },
  },

  // Animation/Motion - Standard (6/10)
  motion: {
    // Smooth transitions
    durations: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easings: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // Breakpoints - Responsive Design
  breakpoints: {
    xs: '375px',   // Mobile small
    sm: '640px',   // Mobile large
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Desktop large
    '2xl': '1536px', // Desktop extra large
  },

  // Z-index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

// Tailwind CSS Configuration Extension
export const tailwindExtension = {
  colors: {
    primary: designSystem.colors.primary,
    secondary: designSystem.colors.secondary,
    accent: designSystem.colors.accent,
    background: designSystem.colors.background,
    foreground: designSystem.colors.foreground,
    card: designSystem.colors.card,
    muted: designSystem.colors.muted,
    destructive: designSystem.colors.destructive,
    success: designSystem.colors.success,
    warning: designSystem.colors.warning,
    info: designSystem.colors.info,
  },
  fontFamily: {
    heading: designSystem.typography.headingFamily,
    body: designSystem.typography.bodyFamily,
  },
  spacing: designSystem.spacing,
  borderRadius: designSystem.borderRadius,
  boxShadow: {
    soft: designSystem.shadows.soft.light,
    'soft-md': designSystem.shadows.soft.medium,
    'soft-lg': designSystem.shadows.soft.dark,
    inset: designSystem.shadows.inset,
    ...designSystem.shadows.elevation,
  },
  transitionDuration: designSystem.motion.durations,
};

// Healthcare-Specific Color Palette
export const healthcareColors = {
  critical: '#DC2626',    // Red - Critical/Urgent
  warning: '#F59E0B',     // Amber - Warning
  success: '#10B981',     // Green - Stable/Success
  info: '#3B82F6',        // Blue - Info
  neutral: '#6B7280',     // Gray - Neutral
  
  // Modality-specific colors
  modalities: {
    allopathy: '#0891B2',    // Cyan
    ayurveda: '#10B981',     // Green
    homeopathy: '#8B5CF6',   // Purple
    unani: '#F59E0B',        // Amber
    siddha: '#EC4899',       // Pink
  },

  // Status-specific colors
  status: {
    critical: '#DC2626',
    urgent: '#F97316',
    underTreatment: '#0891B2',
    stable: '#10B981',
    recovering: '#14B8A6',
    newPatient: '#8B5CF6',
  },
};

// Anti-patterns to Avoid
export const antiPatterns = {
  colors: [
    'Bright neon colors (#FF00FF, #00FF00)',
    'AI purple/pink gradients',
    'Low contrast text (<4.5:1)',
  ],
  motion: [
    'Motion-heavy animations (use sparingly for healthcare)',
    'Scale transforms on hover (causes layout shift)',
    'Animations that ignore prefers-reduced-motion',
  ],
  icons: [
    'Emoji icons (use SVG: Lucide, Heroicons)',
    'Mixed icon sizes randomly',
    'Inconsistent icon stroke widths',
  ],
  layout: [
    'Horizontal scroll on mobile',
    'Content hidden behind fixed navbar',
    'Inconsistent max-width across pages',
  ],
};
