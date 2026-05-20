import { FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { formatBytes } from "../lib/format";

type FileDropzoneProps = {
  file?: File;
  onSelect: (file?: File) => void;
};

export function FileDropzone({ file, onSelect }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    onSelect(files?.[0]);
  }

  return (
    <div
      className={[
        "rounded-md border border-dashed p-6 transition",
        isDragging
          ? "border-cyan-500 bg-cyan-50"
          : "border-slate-300 bg-white hover:border-slate-400",
      ].join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <button
        type="button"
        className="focus-ring flex w-full flex-col items-center justify-center gap-3 rounded p-4 text-center"
        onClick={() => inputRef.current?.click()}
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-white">
          <FileUp className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="text-base font-medium text-slate-950">
          {file ? file.name : "Drop a file or browse"}
        </span>
        <span className="text-sm text-slate-500">
          {file ? `${formatBytes(file.size)} selected` : "Any file type up to 100 MB"}
        </span>
      </button>
    </div>
  );
}
