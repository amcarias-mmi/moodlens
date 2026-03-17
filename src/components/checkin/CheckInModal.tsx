import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MoodSelector } from './MoodSelector'
import { useMoodStore } from '@/store/moodStore'
import { toast } from '@/hooks/use-toast'
import { MOOD_META } from '@/lib/utils'
import type { MoodEntry, MoodLevel } from '@/types/mood'

interface CheckInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingEntry?: MoodEntry
}

const MAX_NOTE = 500

function fireConfetti() {
  void confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.6 },
    colors: ['#22c55e', '#86efac', '#fbbf24', '#fb923c', '#f5a623'],
  })
}

export function CheckInModal({ open, onOpenChange, existingEntry }: CheckInModalProps) {
  const [mood, setMood] = useState<MoodLevel | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const addEntry = useMoodStore((s) => s.addEntry)
  const updateEntry = useMoodStore((s) => s.updateEntry)

  // Pre-populate when editing today's existing entry
  useEffect(() => {
    if (open) {
      setMood(existingEntry?.mood ?? null)
      setNote(existingEntry?.note ?? '')
      setShowConfirm(false)
    }
  }, [open, existingEntry])

  const isEditing = Boolean(existingEntry)
  const canSave = mood !== null
  const today = format(new Date(), 'EEEE, MMMM d')

  const handleSave = async () => {
    if (!mood) return

    // If updating an existing entry, ask for confirmation first
    if (isEditing && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setSaving(true)
    try {
      if (isEditing && existingEntry) {
        await updateEntry(existingEntry.id, { mood, note })
        toast({ title: 'Entry updated ✓', description: 'Your mood has been saved.' })
      } else {
        await addEntry({ mood, note })
        toast({ title: 'Mood logged ✨', description: "You're on a roll. Keep it up!" })
        // Confetti for Great or Good moods
        if (mood >= 4) fireConfetti()
      }
      onOpenChange(false)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-stone-200">
        <AnimatePresence mode="wait">
          {showConfirm ? (
            /* ── Confirmation screen ── */
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 p-2 bg-amber-50 rounded-xl">
                  <AlertTriangle size={18} className="text-amber-600" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-medium text-stone-900">
                    Replace today's entry?
                  </h3>
                  <p className="mt-1 text-sm text-stone-500 leading-relaxed">
                    You've already logged your mood today. Saving will replace your existing entry.
                  </p>
                </div>
              </div>

              {/* Preview of new values */}
              {mood && (
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-2xl">{MOOD_META[mood].emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{MOOD_META[mood].label}</p>
                    {note && (
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{note}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                >
                  Go back
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Yes, replace'}
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ── Check-in form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header strip */}
              <div className="px-6 pt-6 pb-4 border-b border-stone-100">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                  {today}
                </p>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-medium text-stone-900 leading-tight">
                    {isEditing ? "Edit today's entry" : 'How are you feeling?'}
                  </DialogTitle>
                </DialogHeader>
                {isEditing && (
                  <p className="mt-1 text-xs text-amber-600 font-medium">
                    Editing will replace your existing entry
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Mood selector */}
                <MoodSelector value={mood} onChange={setMood} />

                {/* Note textarea */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="mood-note"
                    className="text-xs font-semibold text-stone-500 uppercase tracking-wider"
                  >
                    Note <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <Textarea
                    id="mood-note"
                    placeholder="What's on your mind today?"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
                    rows={3}
                    className="resize-none bg-stone-50 border-stone-200 focus:border-amber-300 focus:ring-amber-200 text-sm placeholder:text-stone-400 rounded-xl"
                  />
                  <p
                    className={`text-right text-xs tabular-nums ${
                      note.length >= MAX_NOTE ? 'text-red-500' : 'text-stone-400'
                    }`}
                  >
                    {note.length} / {MAX_NOTE}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-100"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-40"
                  onClick={() => void handleSave()}
                  disabled={!canSave || saving}
                >
                  {saving ? 'Saving…' : isEditing ? 'Update entry' : 'Log mood'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
