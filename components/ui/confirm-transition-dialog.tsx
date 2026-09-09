"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TASK_STATUS_LABELS } from "@/lib/constants"
import type { TaskStatusType } from "@/lib/constants"

export type ConfirmTransitionDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  toStatus?: TaskStatusType
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonValue: string
  onReasonChange: (v: string) => void
  reasonError?: string | null
  confirmLabel: string
  onConfirm: () => void
  busy?: boolean
}

export function ConfirmTransitionDialog({
  open,
  onOpenChange,
  title,
  description,
  toStatus,
  requireReason,
  reasonLabel = "Lý do *",
  reasonPlaceholder = "Nhập lý do...",
  reasonValue,
  onReasonChange,
  reasonError,
  confirmLabel,
  onConfirm,
  busy,
}: ConfirmTransitionDialogProps) {
  const reasonMissing = !!requireReason && !reasonValue.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{title}</span>
            {toStatus && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-foreground">
                {TASK_STATUS_LABELS[toStatus]}
              </span>
            )}
          </DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        {requireReason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-transition-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-transition-reason"
              placeholder={reasonPlaceholder}
              value={reasonValue}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={4}
            />
            {reasonError && <p className="text-sm text-destructive">{reasonError}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
          <Button onClick={onConfirm} disabled={busy || reasonMissing}>{busy ? "..." : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
