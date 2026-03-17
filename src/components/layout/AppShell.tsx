import { NavBar } from './NavBar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-body transition-colors duration-300">
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-amber-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <NavBar />
      {/* pt-16 for desktop top nav; pb-24 for mobile bottom tab bar */}
      <main id="main-content" className="max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-20 pb-28 md:pb-12">
        {children}
      </main>
    </div>
  )
}
