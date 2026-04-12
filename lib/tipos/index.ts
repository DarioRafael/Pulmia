// Re-exports del módulo de tipos de dominio.
// Importa siempre desde `@/lib/tipos`, no desde los archivos internos.

export type {
    ResultadoAnalisis,
    InformeAnalisis,
    PatologiasDetectadas,
    PatologiaRelevante,
    Severidad,
} from './resultado'
export type { Estudio, EstudioNuevo } from './estudio'
export type { Paciente } from './paciente'
export type { Usuario } from './usuario'
