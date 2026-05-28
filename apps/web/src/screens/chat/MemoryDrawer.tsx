import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { MemoryAddForm } from "./MemoryAddForm";
import { MemoryList } from "./MemoryList";
import { useMemoryEditor } from "./useMemoryEditor";

interface MemoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemoryDrawer({ open, onOpenChange }: MemoryDrawerProps) {
  const editor = useMemoryEditor(open);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md space-y-4">
        <SheetHeader>
          <SheetTitle>Saved memories</SheetTitle>
          <SheetDescription>
            Memories the assistant can recall when memory mode is set to Saved.
          </SheetDescription>
        </SheetHeader>
        <MemoryAddForm saving={editor.saving} onSave={editor.save} />
        <Separator />
        {editor.error ? (
          <p role="alert" className="text-[13px] text-red-400">
            {editor.error}
          </p>
        ) : null}
        <MemoryList
          memories={editor.memories}
          loading={editor.loading}
          onDelete={(id) => void editor.remove(id)}
        />
      </SheetContent>
    </Sheet>
  );
}
