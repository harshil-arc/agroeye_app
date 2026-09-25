---
name: AgroEye Design System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#2b6954'
  on-secondary: '#ffffff'
  secondary-container: '#adedd3'
  on-secondary-container: '#306d58'
  tertiary: '#006194'
  on-tertiary: '#ffffff'
  tertiary-container: '#007bb9'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#b0f0d6'
  secondary-fixed-dim: '#95d3ba'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#0b513d'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.625rem
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.025em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
  data-metric:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a high-precision, utilitarian, and technologically advanced interface engineered specifically for field agronomists, farm operators, and enterprise agricultural analysts. Operating under intense outdoor daylight and direct sunlight conditions across agrarian settings, the interface prioritizes immediate legibility, high radiometric contrast, and unambiguous telemetry visualization.

The design philosophy combines **Clean Utilitarianism** with **Modern Field-Tech Precision**:
- **Clarity under Glare:** Surfaces avoid flat gray mudiness in favor of crisp ivory and pale lichen neutrals (`#F4F7F4`), creating maximum separation against dark forest ink tones (`#064E3B`, `#111827`).
- **Data-Dense Tactility:** Metrics, satellite multispectral indices (NDVI, NDRE), weather telemetry, and soil probe data are articulated through structured micro-surfaces, hairline borders, and distinct status color indicators.
- **Empowering & Professional:** Avoiding folk-farm tropes, the aesthetic evokes advanced remote-sensing instruments, high-precision laboratory dashboards, and durable field equipment software.

## Colors

The color palette is calibrated for high luminance contrast to ensure compliance with field visibility standards under open-sun environments.

### Brand & Interactive Colors
- **Primary Emerald (`#059669`, hover `#047857`, active `#10B981`):** Represents optimal photosynthetic vigor, positive crop health, and primary system confirmations or actions.
- **Forest Slate (`#064E3B`):** Anchors high-priority structural headers, branded navigation panels, and visual hierarchy anchors.
- **Moisture Cyan / Sky (`#0284C7`):** Dedicated to water resources, automated pivot controls, soil moisture depths, and weather telemetry.

### Alert & Telemetry Palette
- **Critical Alert (`#DC2626`):** Crop stress, pest infestations, sensor disconnects, and hardware battery depletion.
- **Precautionary Warning (`#D97706`):** Moderate moisture deficit, heat index spikes, and chemical spray scheduling windows.
- **Optimal / Normal (`#10B981`):** Optimal canopy density, safe nitrogen index, operational gateways.

### Surfaces & Neutral Canvas
- **App Canvas (`#F4F7F4`):** Soft, non-glare lichen-tinted ivory base that prevents white wash-out in daylight.
- **Panel & Card Fill (`#FFFFFF`):** High-luminance crisp white creating crisp figure-ground separation.
- **Sub-surface & Table Alternates (`#EDF2EE`):** Slightly recessed tone for secondary wells, map overlays, and table headers.
- **Dividers & Structural Lines (`#E2E8F0` / `#D1DCD2`):** Crisp 1px division lines.

### Text Hierarchy
- **Title & Primary Data Inks (`#111827` / `#064E3B`):** Deep charcoal and forest inks achieving >10:1 contrast ratios on white.
- **Secondary Field Metadata (`#374151`):** For axis labels, field boundaries, and device IDs.
- **Tertiary Timestamps & Sensor Sub-labels (`#6B7280`):** Legible, anti-aliased micro-copy.

## Typography

The type scale combines **Space Grotesk** for display headlines, functional indicators, telemetry metrics, and UI controls, paired with **Inter** for dense tabular datasets, analytical summaries, and observational logs.

- **Space Grotesk** injects scientific precision and technical geometry, rendering numerical crop metrics, moisture percentages, and GPS coordinates cleanly without optical distortion.
- **Inter** handles dense data grids, advisory text, and sensor telemetry tables, ensuring zero visual fatigue and rapid horizontal scanning.
- Numerical readouts (`data-metric`) must always implement tabular figures (`tnum`) to avoid layout jitter during live telemetry streams.

## Layout & Spacing

The layout uses a multi-device fluid grid structured around an **8px base system** (with 4px micro-increments for compact telemetry tags).

### Grid Foundation
- **Desktop (1200px+):** 12-column layout with 24px (`1.5rem`) gutters and 32px (`2rem`) outer canvas margins. Maximizes split-view screen architecture (GIS satellite maps on left, telemetry stream/controls on right).
- **Tablet (768px - 1199px):** 8-column layout with 16px (`1rem`) gutters and 24px (`1.5rem`) margins. Stacks contextual inspectors beneath primary mapping viewports.
- **Handheld Field Mobile (< 768px):** 4-column layout with 12px (`0.75rem`) gutters and 16px (`1rem`) page margins. Touch targets maintain a minimum 48px square clearance for gloved or outdoor operation.

### Rhythmic Density
Telemetry cards utilize tight internal padding (`space-md`) to pack vital field signals above the fold, while narrative agronomic reports employ relaxed structural margins (`space-xl`) for enhanced reading comfort.

## Elevation & Depth

To combat bright direct sunlight where diffuse shadows wash out entirely, visual depth in this design system is driven by **tonal layering and crisp hairline outlines** rather than heavy drop shadows.

1. **Level 0 (Field Canvas):** `#F4F7F4` matte foundation. Absorbs harsh glare and frames content panels.
2. **Level 1 (Card & Module Layer):** `#FFFFFF` surfaces bounded by a 1px solid border of `#E2E8F0` and reinforced by a subtle, ambient contact shadow: `0px 1px 3px rgba(6, 78, 59, 0.04)`.
3. **Level 2 (Interactive Flyouts & Floating GIS Controls):** `#FFFFFF` panels equipped with a defined 1px outline of `#CBD5E1` and an elevated shadow: `0px 4px 12px -2px rgba(17, 24, 39, 0.08)`.
4. **Level 3 (Modal Alerts & Sensor Alarms):** Grounded by `#FFFFFF` surfaces, a distinct 1.5px structural border, and an authoritative elevation profile: `0px 12px 24px -4px rgba(6, 78, 59, 0.12)`.

## Shapes

The design system maintains a **compact, architectural shape language (Level 1 - Soft)**. 

- Standard interactive components (buttons, input boxes, metric tiles) use a clean **4px (`0.25rem`)** border radius.
- Larger spatial grouping containers, sensor monitoring cards, and modal windows scale to **8px (`0.5rem`)**.
- Status badges and telemetry chips use **12px (`0.75rem`)** pill forms to visually stand out against the geometric matrix of data cards.

This tight corner geometry prevents wasted viewport real estate, optimizes density for enterprise sensor grids, and matches the ruggedized feel of high-tech agricultural instruments.

## Components

### Buttons
- **Primary Field Action:** Solid emerald background (`#059669`), crisp white typography (`Space Grotesk`, semi-bold), 4px border radius, 48px standard touch height for field usability. Hover: `#047857`. Focus: 2px offset ring in `#10B981`.
- **Secondary Utility Action:** Solid pure white background (`#FFFFFF`), 1px structural outline (`#CBD5E1`), text in dark forest green (`#064E3B`). Hover: `#F1F5F2`.
- **Destructive / Danger:** Deep crimson border and text (`#DC2626`) on white; transitions to solid `#DC2626` fill with white text upon confirmation prompt.

### Telemetry Cards & Metric Panels
- Base surface is clean white (`#FFFFFF`) with a 1px border (`#E2E8F0`).
- Card headers feature an uppercase `label-md` category identifier in muted slate (`#6B7280`), adjacent to an inline operational status dot (8px circular dot, colored green, amber, or red).
- Primary metrics feature high-contrast `data-metric` type in deep charcoal (`#111827`) paired with a superscript engineering unit (e.g., `°C`, `hPa`, `m³/h`).

### Sensor Status Chips & Tags
- Compact inline badges with a soft tinted background (10% tint of the parent status color) and a 1px border.
- **Healthy Crop Tag:** Background `#ECFDF5`, text `#065F46`, border `#A7F3D0`.
- **Soil Moisture Stress Tag:** Background `#FEF3C7`, text `#92400E`, border `#FDE68A`.
- **Irrigation Active Tag:** Background `#E0F2FE`, text `#075985`, border `#BAE6FD`.

### Data Inputs & Field Calibration Controls
- Inputs use `#FFFFFF` fill with an inset `0 1px 2px rgba(0,0,0,0.02)` and a 1.5px border (`#D1D5DB`).
- Focus state instantly activates a solid 1.5px primary green border (`#059669`) with an emerald focus wash (`rgba(5, 150, 105, 0.1)`).
- Input labels use `label-md` in Space Grotesk positioned above the input, with units of measure pinned inside the right edge in `#6B7280`.

### Geospatial / Map Floating Controls
- Floating GIS toolbars utilize crisp `#FFFFFF` tiles bounded by `#CBD5E1`.
- Active measurement layers (NDVI, thermal, canopy elevation) are highlighted with a 2px left border accent in `#059669` and a muted green fill (`#F0FDF4`).