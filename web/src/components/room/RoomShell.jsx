export default function RoomShell({
  sidebar,
  header,
  topContent = null,
  stream,
  footer,
}) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden overscroll-none bg-neutral-950 text-white">
      {sidebar}

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {header}
        {topContent}
        {stream}
        {footer}
      </main>
    </div>
  );
}