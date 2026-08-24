// GET-form native select — no client JS needed. Shared between the student
// list and bulk-assign filters.
export function FilterSelect({
  name,
  label,
  value,
  items,
}: {
  name: string
  label: string
  value: string | undefined
  items: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Todos</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  )
}
