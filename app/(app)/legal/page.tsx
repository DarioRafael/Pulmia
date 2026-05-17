'use client'

// Página de marco legal, científico e institucional de Pulmia.
// Organizada en tabs: Sobre Pulmia, Bases Científicas, Datasets,
// Marco Legal, Equipo.

import { useState } from 'react'
import type React from 'react'
import { HeaderApp } from '@/components/layout/header-app'
import { MedicalDisclaimer } from '@/components/medical/medical-disclaimer'

type TabId = 'sobre' | 'literatura' | 'datasets' | 'legal' | 'equipo'

interface Tab {
    readonly id: TabId
    readonly label: string
    readonly icono: React.ReactNode
}

const TABS: Tab[] = [
    {
        id: 'sobre',
        label: 'Sobre Pulmia',
        icono: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 7.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="5.2" r="0.85" fill="currentColor" />
            </svg>
        ),
    },
    {
        id: 'literatura',
        label: 'Bases Científicas',
        icono: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 2H10L13 5V14H3V2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M10 2V5H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <line x1="5.5" y1="8.5" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="5.5" y1="11" x2="10.5" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'datasets',
        label: 'Conjuntos de Datos',
        icono: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <ellipse cx="8" cy="4" rx="5" ry="1.8" stroke="currentColor" strokeWidth="1.3" />
                <path d="M3 4V8C3 9 5.2 9.8 8 9.8C10.8 9.8 13 9 13 8V4" stroke="currentColor" strokeWidth="1.3" />
                <path d="M3 8V12C3 13 5.2 13.8 8 13.8C10.8 13.8 13 13 13 12V8" stroke="currentColor" strokeWidth="1.3" />
            </svg>
        ),
    },
    {
        id: 'legal',
        label: 'Marco Legal',
        icono: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L13 3.5V8C13 11 10.7 13.5 8 14.5C5.3 13.5 3 11 3 8V3.5L8 1.5Z"
                    stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
                <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'equipo',
        label: 'Equipo',
        icono: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M3.5 13.5C3.5 11 5.5 9.5 8 9.5C10.5 9.5 12.5 11 12.5 13.5" stroke="currentColor"
                    strokeWidth="1.3" strokeLinecap="round" />
            </svg>
        ),
    },
]

// ── Datos: Literatura científica ──────────────────────────────────────
interface Referencia {
    autor: string
    anio: string
    titulo: string
    fuente: string
    url: string
}

const REFERENCIAS: Referencia[] = [
    {
        autor: 'NCBI',
        anio: '2025',
        titulo: 'Progress and challenges of artificial intelligence in lung cancer clinical translation',
        fuente: 'pmc.ncbi.nlm.nih.gov',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12214742/',
    },
    {
        autor: 'Thanoon, M. A., et al.',
        anio: '2025',
        titulo: 'Deep Learning Techniques for Lung Cancer Diagnosis with CT Imaging',
        fuente: 'MDPI Information',
        url: 'https://www.mdpi.com/2078-2489/16/6/451',
    },
    {
        autor: 'ArXiv',
        anio: '2025',
        titulo: 'Advanced Deep Learning Techniques for Accurate Lung Cancer Detection and Classification',
        fuente: 'arxiv.org',
        url: 'https://arxiv.org/pdf/2508.06287',
    },
    {
        autor: 'Nature Scientific Reports',
        anio: '2025',
        titulo: 'Explainable AI for lung cancer detection via a custom CNN on CT images',
        fuente: 'nature.com',
        url: 'https://www.nature.com/articles/s41598-025-97645-5',
    },
    {
        autor: 'Springer — AI Review',
        anio: '2025',
        titulo: 'A critical review of explainable deep learning in lung cancer diagnosis',
        fuente: 'link.springer.com',
        url: 'https://link.springer.com/article/10.1007/s10462-025-11445-x',
    },
    {
        autor: 'IEEE',
        anio: '2024',
        titulo: 'EfficientNet-B3-Based Automated Lung Cancer Detection System for CT Scans',
        fuente: 'ieeexplore.ieee.org',
        url: 'https://ieeexplore.ieee.org/document/10983262/',
    },
    {
        autor: 'IEEE',
        anio: '2024',
        titulo: 'Comparative Study of EfficientNet and MobileNet for Lung Cancer Classification',
        fuente: 'ieeexplore.ieee.org',
        url: 'https://ieeexplore.ieee.org/document/10493412/',
    },
    {
        autor: 'INER / SSA',
        anio: '2024',
        titulo: 'INER utiliza inteligencia artificial para detección temprana de cáncer de pulmón',
        fuente: 'gob.mx',
        url: 'https://www.gob.mx/salud/prensa/006-iner-utiliza-inteligencia-artificial-para-impulsar-deteccion-temprana-de-cancer-de-pulmon',
    },
    {
        autor: 'NCBI',
        anio: '2024',
        titulo: 'Standalone deep learning versus experts for diagnosis of lung cancer on chest CT',
        fuente: 'pmc.ncbi.nlm.nih.gov',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11519296/',
    },
    {
        autor: 'NCBI',
        anio: '2024',
        titulo: 'Unified deep learning models for enhanced lung cancer prediction with ResNet-50–101 and EfficientNet-B3',
        fuente: 'pmc.ncbi.nlm.nih.gov',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10946139/',
    },
    {
        autor: 'NCBI',
        anio: '2024',
        titulo: 'Machine-Learning-Enabled Diagnostics with Improved Visualization of Disease Lesions',
        fuente: 'pmc.ncbi.nlm.nih.gov',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11353848/',
    },
    {
        autor: 'NCBI',
        anio: '2023',
        titulo: 'AI-based radiodiagnosis using chest X-rays: A review',
        fuente: 'pmc.ncbi.nlm.nih.gov',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10116151/',
    },
    {
        autor: 'NCBI',
        anio: '2022',
        titulo: 'Application of Artificial Intelligence in Lung Cancer',
        fuente: 'pmc.ncbi.nlm.nih.gov',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8946647/',
    },
    {
        autor: 'NCBI — Diagnostics',
        anio: '2022',
        titulo: 'Deep Learning in Multi-Class Lung Diseases Classification on Chest X-ray Images',
        fuente: 'pmc.ncbi.nlm.nih.gov',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9025806/',
    },
    {
        autor: 'NCI',
        anio: '2022',
        titulo: '¿Sirve la inteligencia artificial para ver el cáncer de formas nuevas y más eficaces?',
        fuente: 'cancer.gov',
        url: 'https://www.cancer.gov/espanol/noticias/temas-y-relatos-blog/2022/inteligencia-artificial-imagenes-cancer',
    },
]

// ── Datos: Datasets ───────────────────────────────────────────────────
interface DatasetInfo {
    nombre: string
    proveedor: string
    tamano: string
    licencia: string
    licenciaColor: 'ok' | 'warn' | 'accent'
    descripcion: string
    url: string
}

const DATASETS: DatasetInfo[] = [
    {
        nombre: 'NIH Chest X-ray Dataset',
        proveedor: 'NIH Clinical Center',
        tamano: '112,120 radiografías · 30,805 pacientes · 14 patologías',
        licencia: 'Uso libre con atribución',
        licenciaColor: 'ok',
        descripcion: 'Base de preentrenamiento para reconocimiento de patrones torácicos generales. Etiquetas generadas por NLP con precisión superior al 90%.',
        url: 'https://huggingface.co/datasets/alkzar90/NIH-Chest-X-ray-dataset',
    },
    {
        nombre: 'CheXpert (Stanford)',
        proveedor: 'Stanford ML Group',
        tamano: '224,316 radiografías · 65,240 pacientes · 14 patologías',
        licencia: 'Research Use Agreement',
        licenciaColor: 'warn',
        descripcion: 'Casi el doble del NIH. Maneja etiquetas inciertas (-1.0). Restringe uso comercial sin licencia adicional.',
        url: 'https://stanfordmlgroup.github.io/competitions/chexpert/',
    },
    {
        nombre: 'CMB-LCA — Cancer Moonshot Biobank',
        proveedor: 'National Cancer Institute (TCIA)',
        tamano: '206 pacientes · 216,000+ imágenes DICOM',
        licencia: 'CC BY 4.0',
        licenciaColor: 'ok',
        descripcion: 'Casos con diagnóstico confirmado de cáncer de pulmón, captados de forma longitudinal a lo largo del tratamiento.',
        url: 'https://www.cancerimagingarchive.net/collection/cmb-lca/',
    },
    {
        nombre: 'LIDC-IDRI',
        proveedor: 'NCI / TCIA',
        tamano: '1,080 casos CT · 8,831 máscaras de 4 radiólogos',
        licencia: 'CC BY 3.0',
        licenciaColor: 'ok',
        descripcion: 'Estándar de oro para nódulos pulmonares. Anotaciones a nivel de píxel empleadas para entrenar el segmentador U-Net.',
        url: 'https://www.cancerimagingarchive.net/collection/lidc-idri/',
    },
    {
        nombre: 'Roboflow Lung Cancer Dataset',
        proveedor: 'Roboflow Universe',
        tamano: '4,598 imágenes CT · 10 clases',
        licencia: 'CC BY 4.0',
        licenciaColor: 'accent',
        descripcion: 'Tipos específicos de carcinoma: adenocarcinoma, células grandes y células escamosas. Modelo base con 86.8% de precisión.',
        url: 'https://universe.roboflow.com/lung-cancer-3gsnq/lung-cancer-dataset',
    },
]

// ── Datos: Equipo ─────────────────────────────────────────────────────
const AUTORES = [
    'Dario Rafael García Bárcenas',
    'Mario Alberto Ibarra Pérez',
    'Gael Alejandro Morales Soria',
    'Juan Carlos Torres Reyna',
    'Jade Cruz Rodríguez',
]

const ASESORES = [
    'José Regino Infante Ventura',
    'Esmeralda Covarrubias Flores',
]

// ── Estilos compartidos ───────────────────────────────────────────────
const styleSeccionTitulo: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    color: 'var(--accent)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 10,
    fontWeight: 600,
}

const styleCard: React.CSSProperties = {
    padding: '20px 22px',
    borderRadius: 14,
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
}

function Heading({ children }: { children: React.ReactNode }) {
    return (
        <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--t0)',
            letterSpacing: '-0.02em',
            marginBottom: 10,
            lineHeight: 1.3,
        }}>
            {children}
        </h2>
    )
}

function Parrafo({ children }: { children: React.ReactNode }) {
    return (
        <p style={{
            fontSize: 13.5,
            color: 'var(--t1)',
            lineHeight: 1.75,
            marginBottom: 12,
        }}>
            {children}
        </p>
    )
}

function BadgeLicencia({ tipo, label }: { tipo: 'ok' | 'warn' | 'accent'; label: string }) {
    const colores = {
        ok: { fg: 'var(--ok)', bg: 'var(--ok-bg)' },
        warn: { fg: 'var(--warn)', bg: 'var(--warn-bg)' },
        accent: { fg: 'var(--accent)', bg: 'var(--accent-glow)' },
    }[tipo]
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 999,
            fontSize: 10,
            fontFamily: 'var(--mono)',
            color: colores.fg,
            background: colores.bg,
            border: `1px solid ${colores.fg}33`,
            fontWeight: 500,
            letterSpacing: '0.03em',
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colores.fg }} />
            {label}
        </span>
    )
}

// ── Vista: Sobre Pulmia ───────────────────────────────────────────────
function VistaSobre() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styleCard}>
                <div style={styleSeccionTitulo}>¿Qué es Pulmia?</div>
                <Heading>Sistema de IA para detección de carcinoma pulmonar</Heading>
                <Parrafo>
                    Pulmia es una <strong style={{ color: 'var(--t0)' }}>herramienta de apoyo clínico</strong> basada
                    en inteligencia artificial que analiza radiografías y tomografías de tórax para identificar
                    indicadores asociados al carcinoma pulmonar. El sistema entrega un porcentaje de probabilidad,
                    señala regiones de interés mediante Grad-CAM o segmentación U-Net, y detecta hasta 19 patologías
                    torácicas adicionales para enriquecer el contexto clínico.
                </Parrafo>
                <Parrafo>
                    El sistema está diseñado como una segunda opinión objetiva, especialmente útil en entornos con
                    acceso limitado a especialistas. <strong style={{ color: 'var(--t0)' }}>No reemplaza el criterio
                    médico</strong> y toda interpretación clínica corresponde a un profesional de la salud
                    autorizado.
                </Parrafo>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Marco académico</div>
                <Parrafo>
                    Pulmia es un proyecto académico desarrollado en el <strong style={{ color: 'var(--t0)' }}>Instituto
                    Tecnológico de Ciudad Victoria</strong> bajo el marco <strong style={{ color: 'var(--t0)' }}>InnovaTecNM
                    2026</strong>. <strong style={{ color: 'var(--t0)' }}>No cuenta con registro sanitario ante
                    COFEPRIS</strong> y su uso se limita a fines académicos, demostrativos y de investigación.
                </Parrafo>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Limitaciones declaradas</div>
                <ul style={{ paddingLeft: 18, color: 'var(--t1)', fontSize: 13.5, lineHeight: 1.75 }}>
                    <li style={{ marginBottom: 6 }}>
                        No es un dispositivo médico autorizado. Sus salidas son indicadores de apoyo, no diagnósticos.
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        Hereda las limitaciones de sus datos (precisión de etiquetas NIH ~90%, sesgo poblacional EE.UU./Vietnam).
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        Las métricas reportadas se obtuvieron en conjuntos de prueba retenidos, no en validación clínica prospectiva.
                    </li>
                    <li>
                        El rendimiento puede variar en hardware distinto al de referencia (GPU NVIDIA RTX 5060 Ti).
                    </li>
                </ul>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Métricas del modelo</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 10,
                    marginTop: 6,
                }}>
                    {[
                        { v: '0.965', l: 'AUC-ROC binario X-ray' },
                        { v: '0.873', l: 'AUC-ROC binario CT' },
                        { v: '0.853', l: 'AUC promedio 19 clases' },
                        { v: '89.3%', l: 'Recall en cáncer' },
                        { v: '93.8%', l: 'Accuracy' },
                        { v: '0.56', l: 'Dice U-Net (CT)' },
                    ].map((m) => (
                        <div key={m.l} style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: 'var(--accent)',
                                fontFamily: 'var(--mono)',
                                marginBottom: 2,
                            }}>{m.v}</div>
                            <div style={{
                                fontSize: 10,
                                color: 'var(--t2)',
                                fontFamily: 'var(--mono)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}>{m.l}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Vista: Literatura ─────────────────────────────────────────────────
function VistaLiteratura() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Fundamentación científica</div>
                <Heading>Literatura que respalda el proyecto</Heading>
                <Parrafo>
                    El desarrollo de Pulmia se sustenta en una revisión rigurosa de la literatura más actual sobre
                    aprendizaje profundo aplicado a la imagenología médica. Las fuentes seleccionadas provienen de
                    instituciones de salud de referencia (NCI, INER, NIH) y de bases indexadas de alto prestigio
                    (Nature, Springer, IEEE, MDPI, ArXiv).
                </Parrafo>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REFERENCIAS.map((ref, idx) => (
                    <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '14px 16px',
                            borderRadius: 10,
                            background: 'var(--bg-2)',
                            border: '1px solid var(--border)',
                            textDecoration: 'none',
                            transition: 'border-color var(--ta), background var(--ta)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--border-h)'
                            e.currentTarget.style.background = 'var(--bg-3)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border)'
                            e.currentTarget.style.background = 'var(--bg-2)'
                        }}
                    >
                        <div style={{
                            flexShrink: 0,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'var(--accent-glow)',
                            border: '1px solid var(--border-focus)',
                            color: 'var(--accent)',
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            fontWeight: 600,
                            marginTop: 2,
                        }}>
                            {ref.anio}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'var(--t0)',
                                lineHeight: 1.45,
                                marginBottom: 4,
                            }}>
                                {ref.titulo}
                            </div>
                            <div style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 11,
                                color: 'var(--t2)',
                                letterSpacing: '0.02em',
                            }}>
                                {ref.autor} · {ref.fuente}
                            </div>
                        </div>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--t2)', marginTop: 4 }}>
                            <path d="M6 4H12V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    )
}

// ── Vista: Datasets ───────────────────────────────────────────────────
function VistaDatasets() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Fuentes de entrenamiento</div>
                <Heading>Conjuntos de datos empleados</Heading>
                <Parrafo>
                    Todos los conjuntos utilizados son de carácter público, fueron descargados de fuentes oficiales y
                    se emplearon respetando las condiciones de licencia de cada proveedor. Ninguna imagen proviene de
                    pacientes mexicanos, hospitales privados ni fuentes no autorizadas.
                </Parrafo>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DATASETS.map((ds) => (
                    <div key={ds.nombre} style={{
                        ...styleCard,
                        padding: '18px 20px',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 10,
                            flexWrap: 'wrap',
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: 'var(--t0)',
                                    letterSpacing: '-0.01em',
                                    marginBottom: 3,
                                }}>
                                    {ds.nombre}
                                </div>
                                <div style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 11,
                                    color: 'var(--t2)',
                                }}>
                                    {ds.proveedor}
                                </div>
                            </div>
                            <BadgeLicencia tipo={ds.licenciaColor} label={ds.licencia} />
                        </div>

                        <div style={{
                            fontSize: 12,
                            color: 'var(--t1)',
                            fontFamily: 'var(--mono)',
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: '7px 12px',
                            marginBottom: 10,
                        }}>
                            {ds.tamano}
                        </div>

                        <p style={{
                            fontSize: 13,
                            color: 'var(--t1)',
                            lineHeight: 1.65,
                            marginBottom: 10,
                        }}>
                            {ds.descripcion}
                        </p>

                        <a
                            href={ds.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 11,
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                            }}
                        >
                            Acceder al dataset
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                <path d="M6 4H12V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Vista: Marco legal ────────────────────────────────────────────────
function VistaLegal() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MedicalDisclaimer variante="banner" storageKey="pulmia.legal.banner.cerrado" />

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Clasificación regulatoria</div>
                <Heading>Software como Dispositivo Médico (SaMD)</Heading>
                <Parrafo>
                    Pulmia se ajusta conceptualmente a la categoría internacional de <strong style={{ color: 'var(--t0)' }}>Software
                    as a Medical Device (SaMD)</strong>: software cuya finalidad incluye diagnóstico, prevención,
                    monitoreo o auxilio en el tratamiento de enfermedades sin estar integrado a hardware médico.
                </Parrafo>
                <Parrafo>
                    Bajo esta clasificación, sería considerado de riesgo moderado a alto dado que sus salidas pueden
                    influir en decisiones clínicas relacionadas con una enfermedad oncológica.
                </Parrafo>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Estado actual ante COFEPRIS</div>
                <div style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'var(--warn-bg)',
                    border: '1px solid var(--warn)',
                    marginBottom: 12,
                }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="8" cy="8" r="7" stroke="var(--warn)" strokeWidth="1.4" />
                        <path d="M8 5v3.5" stroke="var(--warn)" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="8" cy="11.5" r="0.8" fill="var(--warn)" />
                    </svg>
                    <span style={{ fontSize: 13, color: 'var(--warn)', lineHeight: 1.6 }}>
                        <strong style={{ fontWeight: 600 }}>Pulmia NO cuenta con registro sanitario ante COFEPRIS.</strong>
                        {' '}No puede ser comercializado, distribuido ni utilizado como herramienta de diagnóstico clínico
                        en establecimientos de atención médica. Su uso se limita a fines académicos, demostrativos y de
                        investigación.
                    </span>
                </div>
                <Parrafo>
                    La Comisión Federal para la Protección contra Riesgos Sanitarios (COFEPRIS) es la autoridad
                    competente para otorgar el registro sanitario en México. El proceso requiere documentación
                    técnica de validación, evidencia de exactitud y precisión de los datos de salida, y demostración
                    de buenas prácticas de fabricación de software.
                </Parrafo>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Normativa aplicable</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        {
                            norma: 'Ley General de Salud · Reglamento de Insumos para la Salud (RIS)',
                            detalle: 'Clasifica los dispositivos médicos en México por nivel de riesgo. Define al software como dispositivo médico cuando su finalidad esté ligada al diagnóstico.',
                        },
                        {
                            norma: 'NOM-241-SSA1-2021',
                            detalle: 'Incluye expresamente al software dentro del concepto de dispositivo médico cuando se usa para diagnóstico, prevención, vigilancia o tratamiento.',
                        },
                        {
                            norma: 'NOM-004-SSA3-2012 — Expediente Clínico',
                            detalle: 'Regula el contenido obligatorio del expediente clínico físico o electrónico. Reportes generados por IA deberían incorporarse con firma del médico tratante.',
                        },
                        {
                            norma: 'NOM-024-SSA3-2010 — Registro Electrónico para la Salud',
                            detalle: 'Requisitos de interoperabilidad, seguridad y confidencialidad para sistemas de expediente clínico electrónico (HL7, FHIR, DICOM).',
                        },
                        {
                            norma: 'LFPDPPP — Protección de Datos Personales',
                            detalle: 'Imágenes médicas y reportes diagnósticos son datos personales sensibles. Exigen consentimiento expreso por escrito, aviso de privacidad y derechos ARCO.',
                        },
                    ].map((n) => (
                        <div key={n.norma} style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 11,
                                color: 'var(--accent)',
                                marginBottom: 4,
                                fontWeight: 600,
                                letterSpacing: '0.02em',
                            }}>
                                {n.norma}
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.6 }}>
                                {n.detalle}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Limitaciones heredadas</div>
                <ul style={{ paddingLeft: 18, color: 'var(--t1)', fontSize: 13, lineHeight: 1.75 }}>
                    <li style={{ marginBottom: 6 }}>
                        Etiquetas del NIH ChestX-ray14 generadas por NLP automático con precisión declarada ~90%.
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        Sesgo poblacional: datos mayoritariamente de EE.UU. y Vietnam — el desempeño en población
                        mexicana puede variar.
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        CheXpert impone restricciones de uso comercial mediante su Research Use Agreement.
                    </li>
                    <li>
                        Ausencia de validación clínica prospectiva — las métricas provienen de conjuntos de prueba
                        retenidos.
                    </li>
                </ul>
            </div>
        </div>
    )
}

// ── Vista: Equipo ─────────────────────────────────────────────────────
function VistaEquipo() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Equipo de desarrollo</div>
                <Heading>Quienes hacen Pulmia</Heading>
                <Parrafo>
                    Pulmia es un proyecto académico desarrollado en el Instituto Tecnológico de Ciudad Victoria bajo
                    el marco InnovaTecNM 2026.
                </Parrafo>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Autores</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {AUTORES.map((nombre) => (
                        <div key={nombre} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--accent-glow)',
                                border: '1px solid var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 600, color: 'var(--accent)',
                                fontFamily: 'var(--mono)',
                                flexShrink: 0,
                            }}>
                                {nombre.split(' ').map(p => p.charAt(0)).slice(0, 2).join('')}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: 'var(--t0)',
                                    lineHeight: 1.35,
                                }}>
                                    {nombre}
                                </div>
                                <div style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 10,
                                    color: 'var(--t2)',
                                    marginTop: 1,
                                }}>
                                    Autor
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Asesores</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {ASESORES.map((nombre) => (
                        <div key={nombre} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border-focus)',
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--bg-2)',
                                border: '1px solid var(--border-h)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 600, color: 'var(--t1)',
                                fontFamily: 'var(--mono)',
                                flexShrink: 0,
                            }}>
                                {nombre.split(' ').map(p => p.charAt(0)).slice(0, 2).join('')}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: 'var(--t0)',
                                    lineHeight: 1.35,
                                }}>
                                    {nombre}
                                </div>
                                <div style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 10,
                                    color: 'var(--t2)',
                                    marginTop: 1,
                                }}>
                                    Asesor
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styleCard}>
                <div style={styleSeccionTitulo}>Institución</div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: 'var(--accent-glow)',
                        border: '1px solid var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accent)' }}>
                            <path d="M2 22h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            <path d="M4 22V10L12 4L20 10V22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                            <path d="M9 22V14H15V22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t0)', marginBottom: 2 }}>
                            Instituto Tecnológico de Ciudad Victoria
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>
                            InnovaTecNM 2026 · TecNM
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Página ────────────────────────────────────────────────────────────
export default function LegalPage() {
    const [tab, setTab] = useState<TabId>('sobre')

    return (
        <>
            <HeaderApp
                titulo="Marco legal y científico"
                subtitulo="Acerca de Pulmia · Datasets · Literatura · Regulación · Equipo"
            />

            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 2,
                    padding: '8px 24px 0',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    overflowX: 'auto',
                    flexShrink: 0,
                }}>
                    {TABS.map((t) => {
                        const activo = tab === t.id
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '10px 14px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: `2px solid ${activo ? 'var(--accent)' : 'transparent'}`,
                                    color: activo ? 'var(--t0)' : 'var(--t2)',
                                    fontSize: 13,
                                    fontWeight: activo ? 600 : 500,
                                    cursor: 'pointer',
                                    transition: 'color var(--ta), border-color var(--ta)',
                                    whiteSpace: 'nowrap',
                                    letterSpacing: '-0.005em',
                                }}
                                onMouseEnter={e => {
                                    if (!activo) e.currentTarget.style.color = 'var(--t1)'
                                }}
                                onMouseLeave={e => {
                                    if (!activo) e.currentTarget.style.color = 'var(--t2)'
                                }}
                            >
                                {t.icono}
                                {t.label}
                            </button>
                        )
                    })}
                </div>

                {/* Contenido del tab */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    maxWidth: 920,
                    width: '100%',
                    margin: '0 auto',
                }}>
                    {tab === 'sobre' && <VistaSobre />}
                    {tab === 'literatura' && <VistaLiteratura />}
                    {tab === 'datasets' && <VistaDatasets />}
                    {tab === 'legal' && <VistaLegal />}
                    {tab === 'equipo' && <VistaEquipo />}
                </div>
            </div>
        </>
    )
}
