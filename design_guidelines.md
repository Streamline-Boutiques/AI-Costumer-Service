# Design Guidelines: AI Customer Service Website

## Overview
Modern, sleek, elegant design for an AI-powered customer service platform that manages restaurant/bar reservations and customer interactions.

## Color Scheme
- **Primary**: #2563eb (Blue 600) - Professional, trustworthy
- **Secondary**: #1e40af (Blue 700) - Depth and sophistication  
- **Accent**: #3b82f6 (Blue 500) - Interactive elements
- **Background**: #ffffff (White) - Clean, professional
- **Surface**: #f8fafc (Slate 50) - Subtle contrast
- **Text Primary**: #0f172a (Slate 900) - Strong readability
- **Text Secondary**: #475569 (Slate 600) - Supporting content
- **Success**: #10b981 (Emerald 500) - Positive actions
- **Warning**: #f59e0b (Amber 500) - Alerts
- **Error**: #ef4444 (Red 500) - Error states

## Typography
- **Headers**: Inter, system-ui, sans-serif (Clean, modern)
- **Body**: Inter, system-ui, sans-serif (Consistent readability)
- **Font Sizes**:
  - Hero: text-5xl/text-6xl (48-60px)
  - H1: text-4xl (36px)
  - H2: text-3xl (30px)  
  - H3: text-2xl (24px)
  - Body: text-base (16px)
  - Small: text-sm (14px)

## Layout Principles
- **Container**: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- **Spacing**: Consistent 8px grid system (space-2, space-4, space-8, etc.)
- **Sections**: py-16 lg:py-24 for major sections
- **Cards**: rounded-xl shadow-sm border border-gray-200
- **Buttons**: rounded-lg with proper padding and hover states

## Component Guidelines

### Landing Page
- **Hero Section**: 
  - Full-height gradient background (from-blue-50 to-white)
  - Large typography with strong CTAs
  - AI-focused imagery and icons
  
- **Features Section**:
  - 3-column grid layout on desktop
  - Icon + title + description cards
  - Hover effects with subtle animations

- **Demo Preview**:
  - Phone mockup or chat interface preview
  - Video or animated demonstration
  - "Try Demo" CTA button

### Demo Page
- **Input Form**: 
  - Clean, organized form layout
  - Clear field labels and validation
  - Real-time preview/updates
  
- **AI Chat Interface**:
  - Chat bubble design with distinct user/AI styling
  - Voice interaction indicators
  - Professional avatar for AI responses

### Client Dashboard
- **Sidebar Navigation**:
  - Fixed sidebar with menu items
  - Active state indicators
  - Collapsible on mobile

- **Content Areas**:
  - Card-based layout for different sections
  - Data tables with clean styling
  - Form sections with proper spacing

### Voice Integration
- **Voice Controls**:
  - Prominent microphone button
  - Visual feedback during recording
  - Speech-to-text indicators
  - Audio waveform visualization

## Interactive Elements
- **Buttons**:
  - Primary: bg-blue-600 hover:bg-blue-700 text-white
  - Secondary: bg-gray-100 hover:bg-gray-200 text-gray-900
  - Outline: border-gray-300 hover:bg-gray-50
  
- **Forms**:
  - Clean input styling with focus states
  - Proper validation messaging
  - Consistent spacing and alignment

- **Cards**:
  - Subtle shadows and borders
  - Hover effects for interactive cards
  - Proper content hierarchy

## Animations
- **Subtle Transitions**: 250ms ease-in-out for hover states
- **Page Transitions**: Smooth navigation between sections
- **Loading States**: Skeleton screens and spinners
- **Micro-interactions**: Button clicks, form submissions

## Responsive Design
- **Mobile-first**: Design starting from 320px width
- **Breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px
- **Navigation**: Hamburger menu on mobile, full nav on desktop
- **Typography**: Responsive font sizes for readability

## Accessibility
- **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Focus States**: Visible focus indicators for keyboard navigation
- **Alt Text**: Descriptive alt text for all images
- **ARIA Labels**: Proper labeling for screen readers

## Brand Elements
- **Logo**: Clean, modern AI-focused branding
- **Icons**: Lucide React icons for consistency
- **Imagery**: Professional stock photos, AI/technology themed
- **Voice Elements**: Microphone, sound wave, chat bubble icons

## Technical Implementation
- **CSS Framework**: Tailwind CSS
- **Components**: shadcn/ui components
- **Icons**: Lucide React
- **Animations**: Tailwind transitions + custom CSS
- **Responsive**: Mobile-first responsive design