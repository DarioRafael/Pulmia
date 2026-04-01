# Sistema de IA para Deteccion de Carcinoma Pulmonar

> Herramienta de apoyo diagnostico basada en vision computacional para la identificacion de indicadores de cancer de pulmon en imagenes medicas de torax.

---

## Descripcion

Este proyecto desarrolla un sistema de inteligencia artificial capaz de analizar radiografias y tomografias computarizadas de torax, identificar regiones de interes asociadas al carcinoma pulmonar y generar un reporte estructurado con los hallazgos detectados. El sistema esta disenado como segunda opinion clinica, no como reemplazo del criterio medico.

El diagnostico tardio del cancer de pulmon es una de las principales causas de su alta mortalidad. Este sistema apunta a reducir tiempos de evaluacion inicial y ampliar el alcance del tamizaje en entornos con acceso limitado a especialistas.

---

## Salidas del sistema

Ante una imagen de torax como entrada, el sistema produce:

- Region de interes senyalada dentro de la imagen analizada
- Descripcion de hallazgos en cuanto a densidad, forma y distribucion del tejido
- Porcentaje de probabilidad de presencia de carcinoma pulmonar

---

## Stack tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend IA | Python, FastAPI |
| Modelo | PyTorch — ResNet / EfficientNet con fine-tuning |
| Visualizacion | Grad-CAM para mapas de activacion |
| Formatos de imagen | PNG, DICOM, SVS |

---

## Datasets

El modelo se entrena en dos etapas utilizando tres conjuntos de datos publicos de reconocida validez cientifica.

### NIH Chest X-ray Dataset
Base de preentrenamiento para reconocimiento general de patrones toracicos.

- 112,120 radiografias frontales de torax
- 30,805 pacientes unicos
- 14 patologias etiquetadas por imagen
- Division: 86,500 entrenamiento / 25,600 prueba
- Formato PNG 1024x1024 en escala de grises
- Precision de etiquetas superior al 90%

Fuente: [NIH Clinical Center via HuggingFace](https://huggingface.co/datasets/alkzar90/NIH-Chest-X-ray-dataset)

---

### CMB-LCA — Cancer Moonshot Biobank Lung Cancer Collection
Fine-tuning con casos confirmados de cancer de pulmon captados de forma longitudinal.

- 206 pacientes con diagnostico confirmado de cancer de pulmon
- 1,600 series de imagenes radiologicas
- Mas de 216,000 imagenes individuales en formato DICOM
- 299 laminas histopatologicas en formato SVS
- Modalidades: CT, MRI, PET, ultrasonido y radiografia convencional
- Licencia CC BY 4.0

Fuente: [The Cancer Imaging Archive](https://www.cancerimagingarchive.net/collection/cmb-lca/)

---

### Lung Cancer Dataset — Roboflow
Especializacion en clasificacion de tipos de carcinoma pulmonar.

- 4,598 imagenes de tomografia computarizada de torax
- 10 clases incluyendo tejido normal, adenocarcinoma, carcinoma de celulas grandes y carcinoma de celulas escamosas
- Imagenes estandarizadas a 640x640 pixeles
- Division: 3,240 entrenamiento / 678 validacion / 680 prueba
- Modelo base con 86.8% de precision en validacion
- Licencia CC BY 4.0

Fuente: [Roboflow Universe](https://universe.roboflow.com/lung-cancer-3gsnq/lung-cancer-dataset)

---

## Arquitectura del sistema

```
Usuario
   |
   v
Next.js (Frontend)
   |  carga imagen / muestra resultados
   v
API Routes (Next.js)
   |  reenv ia solicitud
   v
FastAPI (Python Backend)
   |  preprocesa imagen
   v
Modelo PyTorch (ResNet / EfficientNet)
   |  inferencia + Grad-CAM
   v
Respuesta: region marcada + descripcion + porcentaje
```

---

## Metodologia de entrenamiento

El entrenamiento se divide en dos etapas:

**Etapa 1 — Preentrenamiento general**
El modelo aprende a reconocer patrones toracicos generales y distinguir hallazgos normales de anomalos usando el NIH Chest X-ray Dataset.

**Etapa 2 — Fine-tuning especializado**
El modelo se especializa en carcinoma pulmonar usando CMB-LCA y el Lung Cancer Dataset de Roboflow, ambos con diagnostico clinico confirmado.

El desbalance natural entre clases (mayoria de imagenes sin hallazgos) se aborda mediante tecnicas de ponderacion durante el entrenamiento, priorizando la minimizacion de falsos negativos.

---

## Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/DarioRafael/Sistema-de-IA-para-Detecci-n-de-Carcinoma-Pulmonar.git
cd Sistema-de-IA-para-Detecci-n-de-Carcinoma-Pulmonar

# Instalar dependencias del frontend
npm install

# Correr en desarrollo
npm run dev
```

El frontend estara disponible en `http://localhost:3000`

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para produccion
npm run start    # Iniciar servidor de produccion
npm run lint     # Revision de codigo
```

---

## Equipo

| Nombre | Rol |
|---|---|
| Dario Rafael Garcia Barcenas | Desarrollo |
| Mario Alberto Ibarra Perez | Desarrollo |
| Gael Alejandro Morales Soria | Desarrollo |
| Juan Carlos Torres Reyna | Desarrollo |
| Jade Cruz Rodriguez | Desarrollo |

**Asesores:**
Jose Regino Infante Ventura — Esmeralda Covarrubias Flores

---

## Estado del proyecto

Este repositorio constituye la fase activa de desarrollo. Los contenidos, la arquitectura, los datasets y los enfoques tecnicos estan sujetos a cambios conforme avance el entrenamiento y la validacion del modelo.

---

## Referencias

- Instituto Nacional del Cancer (NCI). (2022). *Inteligencia artificial para ver el cancer de formas nuevas y mas eficaces.* [cancer.gov](https://www.cancer.gov/espanol/noticias/temas-y-relatos-blog/2022/inteligencia-artificial-imagenes-cancer)

- Secretaria de Salud, INER. (2024). *INER utiliza inteligencia artificial para impulsar deteccion temprana de cancer de pulmon.* [gob.mx](https://www.gob.mx/salud/prensa/006-iner-utiliza-inteligencia-artificial-para-impulsar-deteccion-temprana-de-cancer-de-pulmon)

---

> Este sistema es una herramienta de apoyo clinico. No constituye un diagnostico medico. El criterio del profesional de salud es siempre determinante.