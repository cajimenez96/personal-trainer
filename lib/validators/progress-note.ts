export const NOTE_TYPE_VALUES = ["session", "incident", "discomfort"] as const

export type NoteType = (typeof NOTE_TYPE_VALUES)[number]
