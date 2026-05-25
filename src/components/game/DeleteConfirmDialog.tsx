'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription className="text-zinc-500">
            此操作不可撤销，存档数据将被永久删除。
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            确认删除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
