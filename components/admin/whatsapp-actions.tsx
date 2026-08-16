// Server Component — son <a> planos, no hace falta JS en el cliente.
function toWhatsAppNumber(phone: string) {
  return phone.replace(/\D/g, "")
}

function buildWhatsAppUrl(phone: string, message: string) {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`
}

const linkClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-input px-2.5 font-heading text-sm font-semibold text-foreground hover:bg-muted"

export function WhatsAppActions({
  phone,
  firstName,
  paymentExpiresAt,
}: {
  phone: string | null
  firstName: string
  paymentExpiresAt: Date | null
}) {
  if (!phone) return null

  const routineMessage = `Hola ${firstName}, te actualicé la rutina. ¡Cualquier duda, avisame!`
  const quotaMessage = paymentExpiresAt
    ? `Hola ${firstName}, tu cuota vence el ${new Intl.DateTimeFormat("es-AR").format(paymentExpiresAt)}. ¡Nos vemos en el gym!`
    : null

  return (
    <div className="flex flex-wrap gap-2">
      <a href={buildWhatsAppUrl(phone, routineMessage)} target="_blank" rel="noopener noreferrer" className={linkClass}>
        WhatsApp: rutina actualizada
      </a>
      {quotaMessage && (
        <a href={buildWhatsAppUrl(phone, quotaMessage)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          WhatsApp: cuota por vencer
        </a>
      )}
    </div>
  )
}
