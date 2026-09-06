export default function CareerLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Career tracker</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
        <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">Loading…</div>
        <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">Loading…</div>
        <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">Loading…</div>
      </main>
    </div>
  );
}
