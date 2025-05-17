/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'page-bg': 'var(--color-page-bg)',
        'surface-light': 'var(--color-surface-light)',
        'surface-dark': 'var(--color-surface-dark)',
        'text-on-dark': 'var(--color-text-on-dark)',
        'text-on-light': 'var(--color-text-on-light)',
        'text-muted-on-dark': 'var(--color-text-muted-on-dark)',
        'text-muted-on-light': 'var(--color-text-muted-on-light)',

        'sidebar-bg': 'var(--color-sidebar-bg)',
        'sidebar-text': 'var(--color-sidebar-text)',
        'sidebar-active-bg': 'var(--color-sidebar-active-bg)',
        'sidebar-active-text': 'var(--color-sidebar-active-text)',
        'sidebar-hover-bg': 'var(--color-sidebar-hover-bg)',

        'accent-stripe': 'var(--color-accent-stripe)',
        'focus-ring': 'var(--color-focus-ring)',

        'button-primary-bg': 'var(--color-button-primary-bg)',
        'button-primary-text': 'var(--color-button-primary-text)',
        'button-primary-hover-bg': 'var(--color-button-primary-hover-bg)',

        'link': 'var(--color-link-text)',
        'link-hover': 'var(--color-link-hover-text)',

        'chat-user-message-bg': 'var(--color-chat-user-message-bg)',
        'chat-user-message-text': 'var(--color-chat-user-message-text)',
        'chat-agent-message-bg': 'var(--color-chat-agent-message-bg)',
        'chat-agent-message-text': 'var(--color-chat-agent-message-text)',
        'chat-input-bg': 'var(--color-chat-input-bg)',
        'chat-input-text': 'var(--color-chat-input-text)',
        'chat-placeholder-text': 'var(--color-chat-placeholder-text)'
      },
      fontFamily: {
        sans: 'var(--font-family-default)',
        headings: 'var(--font-family-headings)'
      },
      fontSize: {
        'custom-sidebar-nav': 'var(--font-size-sidebar-nav-item)',
        'custom-body': 'var(--font-size-body)',
        'custom-h1': 'var(--font-size-h1)',
        'custom-h2': 'var(--font-size-h2)',
        'custom-h3': 'var(--font-size-h3)',
        'custom-chat-message': 'var(--font-size-chat-message)',
        'custom-chat-input': 'var(--font-size-chat-input)',
        'custom-button': 'var(--font-size-button)'
      },
      fontWeight: {
        'custom-regular': 'var(--font-weight-regular)',
        'custom-medium': 'var(--font-weight-medium)',
        'custom-semibold': 'var(--font-weight-semibold)',
        'custom-bold': 'var(--font-weight-bold)',
        
        'custom-sidebar-nav': 'var(--font-weight-sidebar-nav-item)',
        'custom-body-weight': 'var(--font-weight-body)',
        'custom-h1-weight': 'var(--font-weight-h1)',
        'custom-h2-weight': 'var(--font-weight-h2)',
        'custom-h3-weight': 'var(--font-weight-h3)',
        'custom-chat-message-weight': 'var(--font-weight-chat-message)',
        'custom-chat-input-weight': 'var(--font-weight-chat-input)',
        'custom-button-weight': 'var(--font-weight-button)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
};