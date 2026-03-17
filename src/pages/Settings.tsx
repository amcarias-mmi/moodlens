import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  AlertTriangle,
  Check,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useMoodStore } from '@/store/moodStore'
import { useThemeStore } from '@/store/themeStore'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/cn'
import type { MoodEntry } from '@/types/mood'

/* ── Validation ── */

function validateEntry(raw: unknown): MoodEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (typeof e.id !== 'string' || !e.id) return null
  if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return null
  if (typeof e.mood !== 'number' || ![1, 2, 3, 4, 5].includes(e.mood)) return null
  if (typeof e.note !== 'string') return null
  if (typeof e.timestamp !== 'number') return null
  if (typeof e.createdAt !== 'number') return null
  if (typeof e.updatedAt !== 'number') return null
  return {
    id: e.id,
    date: e.date,
    timestamp: e.timestamp,
    mood: e.mood as MoodEntry['mood'],
    note: e.note,
    sentimentScore: typeof e.sentimentScore === 'number' ? e.sentimentScore : null,
    sentimentComparative: typeof e.sentimentComparative === 'number' ? e.sentimentComparative : null,
    divergenceFlag: typeof e.divergenceFlag === 'boolean' ? e.divergenceFlag : false,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }
}

/* ── Main page ── */

export default function Settings() {
  const navigate = useNavigate()
  const entries = useMoodStore((s) => s.entries)
  const clearAll = useMoodStore((s) => s.clearAll)
  const importEntries = useMoodStore((s) => s.importEntries)
  const { isDark, toggle } = useThemeStore()

  /* Export */
  function handleExport() {
    const json = JSON.stringify(entries, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moodlens-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: `Exported ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` })
  }

  /* Import */
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<{ valid: MoodEntry[]; invalid: number } | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as unknown
        const arr = Array.isArray(parsed) ? parsed : []
        const valid: MoodEntry[] = []
        let invalid = 0
        for (const item of arr as unknown[]) {
          const entry = validateEntry(item)
          if (entry) valid.push(entry)
          else invalid++
        }
        if (valid.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No valid entries found',
            description: invalid > 0 ? `${invalid} record${invalid === 1 ? '' : 's'} failed validation.` : undefined,
          })
          return
        }
        setImportPreview({ valid, invalid })
        setImportDialogOpen(true)
      } catch {
        toast({ variant: 'destructive', title: 'Invalid JSON file', description: 'Could not parse the selected file.' })
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  async function handleImportConfirm() {
    if (!importPreview) return
    setImporting(true)
    try {
      const count = await importEntries(importPreview.valid, importMode)
      toast({
        title: `Imported ${count} ${count === 1 ? 'entry' : 'entries'}`,
        description: importMode === 'merge' && importPreview.valid.length !== count
          ? `${importPreview.valid.length - count} skipped (dates already exist)`
          : undefined,
      })
      setImportDialogOpen(false)
      setImportPreview(null)
    } catch {
      toast({ variant: 'destructive', title: 'Import failed', description: 'Something went wrong while saving entries.' })
    } finally {
      setImporting(false)
    }
  }

  /* Erase */
  const [eraseOpen, setEraseOpen] = useState(false)
  const [eraseInput, setEraseInput] = useState('')
  const [erasing, setErasing] = useState(false)

  async function handleErase() {
    if (eraseInput !== 'DELETE') return
    setErasing(true)
    try {
      await clearAll()
      toast({ title: 'All data erased' })
      setEraseOpen(false)
      navigate('/')
    } catch {
      toast({ variant: 'destructive', title: 'Could not erase data' })
    } finally {
      setErasing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pt-2"
      >
        <h1 className="font-display italic text-5xl md:text-6xl font-medium text-stone-900 dark:text-stone-50 leading-[1.1]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Manage your data and preferences.
        </p>
      </motion.div>

      {/* Settings sections */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
        className="space-y-5"
      >
        {/* Preferences */}
        <Section title="Preferences">
          <SettingRow
            label="Dark mode"
            description="Easy on the eyes, especially at night"
            action={<DarkToggle isDark={isDark} onToggle={toggle} />}
          />
        </Section>

        {/* Your Data */}
        <Section title="Your Data">
          <SettingRow
            label="Export entries"
            description={
              entries.length > 0
                ? `Download all ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} as a JSON file`
                : 'No entries to export yet'
            }
            action={
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 gap-1.5 flex-shrink-0"
                onClick={handleExport}
                disabled={entries.length === 0}
              >
                <Download size={13} />
                Export
              </Button>
            }
          />
          <div className="h-px bg-stone-100 dark:bg-stone-800 mx-4" />
          <SettingRow
            label="Import entries"
            description="Restore from a previously exported MoodLens JSON file"
            action={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={handleFileChange}
                  aria-label="Import JSON file"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 gap-1.5 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} />
                  Import
                </Button>
              </>
            }
          />
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone" danger>
          <SettingRow
            label="Erase all data"
            description="Permanently delete every entry. This cannot be undone."
            action={
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800 gap-1.5 flex-shrink-0"
                onClick={() => { setEraseInput(''); setEraseOpen(true) }}
                disabled={entries.length === 0}
              >
                <Trash2 size={13} />
                Erase
              </Button>
            }
          />
        </Section>

        {/* About */}
        <div className="flex items-center gap-2 px-1 text-xs text-stone-400 dark:text-stone-600">
          <Info size={12} />
          <span>MoodLens v1.0 · All data stored locally on your device</span>
        </div>
      </motion.div>

      {/* Import dialog */}
      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open)
          if (!open) setImportPreview(null)
        }}
      >
        <DialogContent className="sm:max-w-[440px] rounded-2xl border-stone-200 dark:border-stone-700">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium">
              Import entries
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Found{' '}
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {importPreview?.valid.length ?? 0} valid
              </span>{' '}
              {(importPreview?.valid.length ?? 0) === 1 ? 'entry' : 'entries'}
              {importPreview?.invalid
                ? ` (${importPreview.invalid} skipped — failed validation)`
                : ''}
              .
              {entries.length > 0 &&
                ' You already have data — choose how to handle conflicts.'}
            </DialogDescription>
          </DialogHeader>

          {entries.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {(['merge', 'replace'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setImportMode(mode)}
                  className={cn(
                    'flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-150',
                    importMode === mode
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 hover:border-stone-300 dark:hover:border-stone-600'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize text-stone-900 dark:text-stone-100">
                      {mode}
                    </span>
                    {importMode === mode && (
                      <Check size={14} className="text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    {mode === 'merge'
                      ? 'Add new entries, skip existing dates'
                      : 'Replace all your current data'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-stone-200 dark:border-stone-700"
              onClick={() => { setImportDialogOpen(false); setImportPreview(null) }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200"
              onClick={() => void handleImportConfirm()}
              disabled={importing}
            >
              {importing
                ? 'Importing…'
                : `Import ${importPreview?.valid.length ?? 0} ${(importPreview?.valid.length ?? 0) === 1 ? 'entry' : 'entries'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Erase confirmation dialog */}
      <Dialog
        open={eraseOpen}
        onOpenChange={(open) => {
          setEraseOpen(open)
          if (!open) setEraseInput('')
        }}
      >
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-stone-200 dark:border-stone-700">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Erase all data?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              This will permanently delete all{' '}
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
              . There is no way to recover them. Type{' '}
              <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span>{' '}
              to confirm.
            </DialogDescription>
          </DialogHeader>

          <input
            type="text"
            value={eraseInput}
            onChange={(e) => setEraseInput(e.target.value)}
            placeholder="Type DELETE to confirm"
            className={cn(
              'w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-stone-900',
              'text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600',
              'font-mono focus:outline-none focus:ring-2 transition-all',
              eraseInput === 'DELETE'
                ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900/50'
                : 'border-stone-200 dark:border-stone-700 focus:ring-stone-200 dark:focus:ring-stone-700'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && eraseInput === 'DELETE') void handleErase()
            }}
            autoComplete="off"
            spellCheck={false}
          />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-stone-200 dark:border-stone-700"
              onClick={() => { setEraseOpen(false); setEraseInput('') }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => void handleErase()}
              disabled={eraseInput !== 'DELETE' || erasing}
            >
              {erasing ? 'Erasing…' : 'Erase everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Sub-components ── */

function Section({
  title,
  children,
  danger,
}: {
  title: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div>
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-wider mb-2 px-1',
          danger
            ? 'text-red-400 dark:text-red-500'
            : 'text-stone-400 dark:text-stone-500'
        )}
      >
        {title}
      </p>
      <div
        className={cn(
          'bg-white dark:bg-stone-900 rounded-2xl border shadow-sm overflow-hidden',
          danger
            ? 'border-red-100 dark:border-red-900/30'
            : 'border-stone-200 dark:border-stone-700/50'
        )}
      >
        {children}
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  action,
}: {
  label: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4 min-h-[72px]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{label}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  )
}

function DarkToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
        isDark ? 'bg-stone-700' : 'bg-stone-200'
      )}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
    >
      <motion.span
        className={cn(
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-sm flex items-center justify-center',
          isDark ? 'bg-stone-900' : 'bg-white'
        )}
        animate={{ x: isDark ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
      >
        {isDark ? (
          <Moon size={12} className="text-amber-400" />
        ) : (
          <Sun size={12} className="text-amber-500" />
        )}
      </motion.span>
    </button>
  )
}
