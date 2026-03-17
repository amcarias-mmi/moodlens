import { NavBar } from './NavBar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-body transition-colors duration-300">
      <NavBar />
      {/* pt-16 for desktop top nav; pb-24 for mobile bottom tab bar */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-20 pb-28 md:pb-12">
        {children}
      </main>
    </div>
  )
}
