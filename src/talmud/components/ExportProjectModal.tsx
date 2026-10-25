import { Archive, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import sourceArchive from '@/assets/talmud-source.zip.asset.json';
import projectArchive from '@/assets/talmud-project.zip.asset.json';

export function ExportProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; isDark?: boolean }) {
  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="export-dialog max-w-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Archive className="size-5" />პროექტის ჩამოტვირთვა</DialogTitle>
          <DialogDescription>სორსი და სრული პროექტი</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <section className="border-b border-border pb-4">
            <h3 className="font-semibold">Source Code ZIP</h3>
            <p className="mt-1 mb-3 text-sm text-muted-foreground">კოდი, ტესტები და კონფიგურაცია</p>
            <Button asChild variant="outline"><a href={sourceArchive.url} download><Download />სორსის ჩამოტვირთვა</a></Button>
          </section>
          <section>
            <h3 className="font-semibold">Full Project ZIP</h3>
            <p className="mt-1 mb-3 text-sm text-muted-foreground">კოდი, PDF ფაილები, შრიფტები და იკონები</p>
            <Button asChild><a href={projectArchive.url} download><Download />პროექტის ჩამოტვირთვა</a></Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
