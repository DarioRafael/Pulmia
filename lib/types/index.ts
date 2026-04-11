export type MessageRole = 'user' | 'ai'

export interface Message {
    id: string
    role: MessageRole
    content: string
    timestamp: Date
    // Cuando el mensaje incluye una radiografia adjunta.
    // Por ahora acepta cualquier imagen; cuando el backend soporte DICOM
    // se restringira el tipo MIME en InputBar.tsx
    imageDataUrl?: string
    imageCaption?: string
    isStreaming?: boolean
    gradcamDataUrl?: string
}

export interface Chat {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
    messageCount: number
    // Identificador del paciente al que pertenece esta sesion
    patientId?: string
}

export interface Patient {
    id: string
    name: string
    // Fecha de nacimiento para calcular edad en el contexto clinico
    dateOfBirth?: Date
    // Notas clinicas breves que aparecen en la lista de chats
    notes?: string
}

export type StatusKey = 'idle' | 'thinking' | 'online'

export interface AppStatus {
    label: string
    key: StatusKey
}