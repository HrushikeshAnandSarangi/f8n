import Image from "next/image";

export default function User() {
  return (
    <div className="flex h-16 items-center border-b border-border px-2">
      <div className="flex w-full items-center rounded-md px-2 py-1">
        <Image src="/f8n.svg" alt="f8n" className="mr-2 rounded-full" width={36} height={36} />
        <div className="flex flex-col">
          <span className="text-sm font-medium">f8n</span>
          <span className="text-xs text-muted-foreground">Free agent builder</span>
        </div>
      </div>
    </div>
  );
}
