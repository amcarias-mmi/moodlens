import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMoodStore } from '@/store/moodStore'
import { toast } from '@/hooks/use-toast'
import { MOOD_META } from '@/lib/utils'
import type { MoodEntry } from '@/types/mood'

interface EntryCardProps {
  entry: MoodEntry
  onEdit: (entry: MoodEntry) => void
  index?: number
}

const NOTE_EXCERPT = 100

export function EntryCard({ entry, onEdit, index = 0 }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const deleteEntry = useMoodStore((s) => s.deleteEntry)
  const meta = MOOD_META[entry.mood]

  const hasLongNote = entry.note.length > NOTE_EXCERPT
  const noteDisplay = expanded || !hasLongNote ? entry.note : entry.note.slice(0, NOTE_EXCERPT)

  const formattedDate = format(new Date(entry.date + 'T00:00:00'), 'EEE, MMM d, yyyy')
  const formattedTime = format(new Date(entry.timestamp), 'h:mm a')

  const sentimentLabel =
    entry.sentimentScore === null
      ? null
      : entry.sentimentScore > 0.2
        ? 'Positive'
        : entry.sentimentScore < -0.2
          ? 'Negative'
          : 'Neutral'

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteEntry(entry.id)
      toast({ title: 'Entry deleted', description: formattedDate })
      setDeleteOpen(false)
    } catch {
      toast({ variant: 'destructive', title: 'Could not delete entry' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{
            duration: 0.2,
            delay: Math.min(index * 0.04, 0.2),
          }}
          className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group"
        >
          {/* Mood color left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ backgroundColor: meta.color }}
          />

          <div className="pl-5 pr-4 py-4">
            {/* Top row: date + actions */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* Date in Cormorant italic */}
                <p className="font-display italic text-stone-400 dark:text-stone-500 text-sm leading-none">
                  {formattedDate}
                </p>

                {/* Mood row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xl leading-none" role="img" aria-hidden="true">
                    {meta.emoji}
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{meta.label}</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">{formattedTime}</span>
                </div>
              </div>

              {/* Action buttons — visible on hover (desktop) / always subtle (mobile) */}
              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label="Edit entry"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Note text */}
            {entry.note && (
              <div className="mt-3">
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {noteDisplay}
                  {hasLongNote && !expanded && (
                    <span className="text-stone-400">…</span>
                  )}
                </p>
                {hasLongNote && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1 mt-1.5 text-xs font-medium text-stone-400 hover:text-amber-600 transition-colors"
                    aria-expanded={expanded}
                  >
                    {expanded ? (
                      <>
                        <ChevronUp size={12} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Footer badges */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex-wrap">
              {sentimentLabel ? (
                <Badge
                  variant={
                    sentimentLabel === 'Positive'
                      ? 'positive'
                      : sentimentLabel === 'Negative'
                        ? 'negative'
                        : 'neutral'
                  }
                >
                  {sentimentLabel}
                </Badge>
              ) : (
                <span className="text-xs text-stone-400">—</span>
              )}

              {entry.sentimentScore !== null && (
                <span className="text-xs text-stone-400 tabular-nums font-mono">
                  {entry.sentimentScore > 0 ? '+' : ''}
                  {entry.sentimentScore.toFixed(2)}
                </span>
              )}

              <AnimatePresence>
                {entry.divergenceFlag && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium cursor-help select-none">
                          <AlertTriangle size={10} strokeWidth={2.5} />
                          Divergence
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
                        Your note tone didn't match your selected mood
                      </TooltipContent>
                    </Tooltip>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </TooltipProvider>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium text-stone-900 dark:text-stone-100">
              Delete this entry?
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Your entry from{' '}
              <span className="font-medium text-stone-700 dark:text-stone-300">{formattedDate}</span> will be
              permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="rounded-xl border-stone-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
