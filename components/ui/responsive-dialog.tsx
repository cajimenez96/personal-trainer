"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

export interface ResponsiveDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  showSwipeHandle?: boolean
  modal?: boolean
}

function ResponsiveDialog({
  open,
  defaultOpen,
  onOpenChange,
  showSwipeHandle = true,
  modal = true,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange ? (val: boolean) => onOpenChange(val) : undefined}
        showSwipeHandle={showSwipeHandle}
        swipeDirection="down"
        modal={modal}
      >
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (val: boolean) => onOpenChange(val) : undefined}
      modal={modal}
    >
      {children}
    </Dialog>
  )
}

export interface ResponsiveDialogTriggerProps {
  render?: React.ReactElement
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  [key: string]: any
}

function ResponsiveDialogTrigger({
  render,
  children,
  ...props
}: ResponsiveDialogTriggerProps) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <DrawerTrigger render={render} {...props}>{children}</DrawerTrigger>
  }
  return <DialogTrigger render={render} {...props}>{children}</DialogTrigger>
}

export interface ResponsiveDialogCloseProps {
  render?: React.ReactElement
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  [key: string]: any
}

function ResponsiveDialogClose({
  render,
  children,
  ...props
}: ResponsiveDialogCloseProps) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <DrawerClose render={render} {...props}>{children}</DrawerClose>
  }
  return <DialogClose render={render} {...props}>{children}</DialogClose>
}

export interface ResponsiveDialogContentProps {
  className?: string
  children?: React.ReactNode
  showCloseButton?: boolean
  [key: string]: any
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={cn("max-h-[85dvh]", className)} {...props}>
        <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={className} showCloseButton={showCloseButton} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <DrawerHeader className={cn("px-4 pt-2 text-left", className)} {...props} />
  }
  return <DialogHeader className={className} {...props} />
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <DrawerFooter className={cn("px-4 pt-2 pb-0", className)} {...props} />
  }
  return <DialogFooter className={className} {...props} />
}

function ResponsiveDialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <DrawerTitle className={className} {...props} />
  }
  return <DialogTitle className={className} {...props} />
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return <DrawerDescription className={className} {...props} />
  }
  return <DialogDescription className={className} {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
}
