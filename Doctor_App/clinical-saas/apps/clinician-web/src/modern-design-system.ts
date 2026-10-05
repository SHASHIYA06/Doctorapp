/**
 * Modern Design System - Doctor App v2
 * Generated from ui-ux-pro-max Design Intelligence
 * 
 * Style: Brutalism + Bento Grid (Bold, Clean, Professional)
 * Colors: Trust Blue + Orange CTA
 * Typography: Poppins (headings) + Open Sans (body)
 * Motion: Standard (7/10) with GSAP stagger animations
 * Density: Dashboard-optimized (8/10)
 */

export const modernDesignSystem = {
  // Color Palette - Trust Blue + Orange CTA
  colors: {
    // Primary & Secondary
    primary: '#2563EB',        // Trust Blue - Main brand color
    onPrimary: '#FFFFFF',      // White text on primary
    secondary: '#3B82F6',      // Light Blue - Secondary
    onSecondary: '#000000',    // Dark text on secondary
    
    // Accent & CTA
    accent: '#EA580C',         // Vibrant Orange - Calls to action
    onAccent: '#000000',       // Dark text on accent
    
    // Backgrounds
    background: '#F8FAFC',     // Very light blue-gray background
    foreground: '#1E293B',     // Dark blue-gray text
    card: '#FFFFFF',           // White cards
    cardForeground: '#1E293B', // Dark text on cards
    
    // Semantic Colors
    muted: '#E9EFF8',          // Muted background
    mutedForeground: '#475569', // Gray text
    border: '#E2E8F0',         // Light borders
    
    // Status Colors
    success: '#10B981',        // Green - Success/Stable
    warning: '#F59E0B',        // Amber - Warning/Attention
    destructive: '#DC2626',    // Red - Error/Critical
    info: '#0EA5E9',           // Sky Blue - Information
    
    // Destructive
    onDestructive: '#FFFFFF',
    
    // Focus
    ring: '#2563EB',           // Blue focus ring
  },

  // Typography - Poppins + Open Sans (Modern, Professional)
  typography: {
    headingFamily: 'Poppins, system-ui, sans-serif',
    bodyFamily: 'Open Sans, system-ui, sans-serif',
    
    // Heading Styles
    h1: {
      fontSize: '2.5rem',      // 40px
      lineHeight: '3rem',      // 48px
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',        // 32px
      lineHeight: '2.5rem',    // 40px
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',      // 24px
      lineHeight: '2rem',      // 32px
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',     // 20px
      lineHeight: '1.75rem',   // 28px
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.125rem',    // 18px
      lineHeight: '1.5rem',    // 24px
      fontWeight: 600,
    },

    // Body Styles
    bodyLarge: {
      fontSize: '1.125rem',    // 18px
      lineHeight: '1.75rem',   // 28px
      fontWeight: 500,
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

    // Label/Badge Styles
    labelLarge: {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.25rem',   // 20px
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    labelSmall: {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1rem',      // 16px
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },

  // Spacing Scale - Dense Dashboard (8/10)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '2.5rem',  // 40px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
  },

  // Border Radius - Modern (8-16px primary)
  borderRadius: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px - default for cards
    xl: '1.5rem',     // 24px - large elements
    full: '9999px',   // Circular
  },

  // Shadows - Modern, Clean (not neumorphism)
  shadows: {
    // Subtle elevation shadows
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    
    // Hover shadow (slightly elevated)
    hover: '0 12px 20px -2px rgba(0, 0, 0, 0.12)',
    
    // Focus shadow
    focus: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },

  // Animation/Motion - Standard (7/10)
  motion: {
    // Smooth transitions
    durations: {
      fast: '120ms',
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
      backOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Grid Layout - Bento Box optimized
  grid: {
    cols: {
      xs: '1',      // Mobile
      sm: '2',      // Tablet
      md: '3',      // Small desktop
      lg: '4',      // Large desktop
    },
    gap: '1rem',    // 16px default gap
    gapDense: '0.75rem', // 12px for dense layouts
  },

  // Breakpoints - Responsive Design
  breakpoints: {
    xs: '375px',    // Mobile small
    sm: '640px',    // Mobile large
    md: '768px',    // Tablet
    lg: '1024px',   // Desktop
    xl: '1280px',   // Desktop large
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

// Healthcare-Specific Color Palette
export const healthcareModernColors = {
  // Status Colors (consistent across app)
  status: {
    critical: '#DC2626',    // Red - Critical/Urgent
    urgent: '#F97316',      // Orange-red - High priority
    underTreatment: '#2563EB', // Blue - Active treatment
    stable: '#10B981',      // Green - Stable condition
    recovering: '#06B6D4',  // Cyan - Recovering
    newPatient: '#8B5CF6',  // Purple - New
  },
  
  // Modality Colors (medical systems)
  modalities: {
    allopathy: '#2563EB',   // Blue
    ayurveda: '#10B981',    // Green
    homeopathy: '#8B5CF6',  // Purple
    unani: '#F59E0B',       // Amber
    siddha: '#EC4899',      // Pink
  },
};

// Anti-patterns to Avoid
export const antiPatterns = {
  colors: [
    'Neon colors (#FF00FF, #00FF00)',
    'Low contrast text (<4.5:1)',
    'Clashing status colors',
  ],
  motion: [
    'Animations without prefers-reduced-motion check',
    'Animations longer than 500ms',
    'Scale transforms causing layout shift on hover',
  ],
  icons: [
    'Emoji icons (use SVG: Lucide)',
    'Inconsistent icon sizes',
  ],
  layout: [
    'Horizontal scroll on mobile',
    'Content hidden behind fixed navbar',
    'Inconsistent max-width across pages',
  ],
};
