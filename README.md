# Sistema Web de Presupuestos y Costeo de Proyectos de Ingeniería
## KEV Process SpA b

Aplicación web corporativa para presupuestación, costeo y generación automatizada de ofertas técnico-comerciales para proyectos de automatización, control de procesos y suministros industriales de **KEV Process SpA**.

Diseñada y estandarizada a partir del análisis exhaustivo del repositorio de ofertas generadas desde el año 2026 en adelante (`C:\DATA\KEV Ofertas\2026`), tomando como caso base y norma el proyecto `101-2026 - Migracion ARRANCADOR SUAVE SIRIUS`.

---

## 🚀 Características Principales

### 1. Dos Modos de Operación Sincronizados
- **Modo Cuestionario (Asistente Guiado):**
  - Levantamiento paso a paso estructurado en 7 etapas:
    1. *Datos Generales:* Cliente, Faena/Planta, Correlativo oficial (`XXX-2026`), Contacto.
    2. *Ingeniería y HH:* Semanas en oficina, días en terreno, asignación de horas por especialidad (PCS7, SCADA, PLC, PEM, Técnico, Planimetría, FAT).
    3. *Equipos y Hardware:* Catálogo integrado con códigos Siemens, cálculo automático de costo neto mediante la matriz oficial de descuentos (`XG` 55%, `XD` 61%, `ZF` 41%, etc.).
    4. *Integración Eléctrica:* Armado de tableros, cableado, borneras y pruebas de taller.
    5. *Logística y Terreno (Otros):* Viáticos diarios, noches de alojamiento, arriendo de camioneta, combustible, vuelos y fletes.
    6. *Márgenes Comerciales:* Sliders interactivos con la fórmula corporativa $\text{Precio} = \frac{\text{Costo}}{1 - \text{Margen}}$.
    7. *Condiciones Contractuales:* Tabla de estados de pago (EP-1 a EP-4) y términos legales de garantía.
- **Modo Desarrollo (Planilla Matricial de 9 Pestañas):**
  - Grilla interactiva editable celda por celda que replica fielmente el libro de trabajo de Excel:
    - `RESUMEN GENERAL`
    - `Ingeniería y Planificación`
    - `Adicionales`
    - `Integración Eléctrica`
    - `Equipos`
    - `Flete`
    - `Montaje`
    - `Otros`
    - `Listado`
  - Sincronización bidireccional instantánea entre ambos modos.

### 2. Generación Automatizada de Documentos Oficiales
- **Planilla Excel (`.xlsx`):**
  - Genera un archivo con las 9 hojas exactamente iguales al formato corporativo, preservando fórmulas de Excel (`SUM`, `VLOOKUP`, cocientes de margen), formato de moneda `$ #.##0`, bordes finos y encabezados azul marino institucional (`#0F2744` / `#1B365D`).
- **Propuesta Técnico-Comercial y Contractual Word (`.docx`):**
  - Documento formal listo para la firma del cliente, con membrete institucional, tablas estilizadas de hardware y servicios, cuadro ejecutivo de precios en CLP y USD, cronograma, estados de pago y las **7 cláusulas oficiales de bases legales y garantía de servicio y desarrollo de lógicas de control** (extraídas de `DOC0021241-ESD-2025 Formato Garantía`).

---

## 🛠️ Opciones de Despliegue en Servidor Web

La aplicación cuenta con una arquitectura híbrida de alta disponibilidad:

### Opción A: Despliegue en Servidor Web Node.js / Linux (Recomendada)
1. Abrir terminal en la carpeta `C:\DATA\ANTIGRAVITY\DEV-001`.
2. Ejecutar:
   ```bash
   node server.js
   ```
3. La aplicación estará disponible en la intranet o web en `http://localhost:3000` (o la IP del servidor).
4. Para mantener el servicio siempre activo en producción, se puede usar PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "kev-costeo"
   pm2 save
   ```

### Opción B: Despliegue en Microsoft IIS (Windows Server)
1. La carpeta incluye el archivo preconfigurado `web.config`.
2. Instalar el módulo **HttpPlatformHandler** o **iisnode** en IIS.
3. Crear un nuevo Sitio Web en IIS apuntando a la ruta física `C:\DATA\ANTIGRAVITY\DEV-001`.

### Opción C: Despliegue en Contenedor Docker
1. Construir la imagen:
   ```bash
   docker build -t kev-presupuesto .
   ```
2. Ejecutar el contenedor:
   ```bash
   docker run -d -p 3000:3000 --name kev-app kev-presupuesto
   ```

### Opción D: Ejecución Local / Modo Autónomo sin Instalaciones
- Haga doble clic en el archivo `iniciar.bat`.
- O bien, abra directamente `public/index.html` en Google Chrome, Microsoft Edge o Firefox. La aplicación funcionará al 100% de manera offline gracias a sus bibliotecas locales integradas.

---

## 📋 Estructura de Directorios

```
C:\DATA\ANTIGRAVITY\DEV-001\
├── server.js                      # Servidor HTTP y API REST (Node.js)
├── package.json                   # Manifiesto del proyecto
├── iniciar.bat                    # Lanzador rápido para Windows
├── Dockerfile                     # Configuración Docker
├── web.config                     # Configuración Microsoft IIS
├── README.md                      # Documentación del sistema
├── public\
│   ├── index.html                 # Interfaz visual (Cuestionario + Desarrollo)
│   ├── app.js                     # Motor reactivo de cálculo y generadores
│   ├── styles.css                 # Estilos institucionales KEV Process
│   ├── presets.js                 # Catálogos, descuentos Siemens y bases legales
│   └── lib\
│       ├── exceljs.min.js         # Generador nativo de libros XLSX
│       ├── docx.umd.js            # Generador nativo de documentos DOCX
│       ├── lucide.min.js          # Iconos vectoriales
│       └── FileSaver.min.js       # Gestor de descargas en navegador
└── templates\
    ├── plantilla_base.xlsx        # Libro de trabajo modelo (101-2026)
    └── plantilla_oferta.docx      # Propuesta Word modelo (101-2026)
```

---

## 🔐 Control de Acceso Seguro y Gestión de Usuarios (v1.2.0)

La plataforma cuenta con una pasarela de autenticación previa (**Auth Gateway**) que protege la información confidencial de costos, tarifas de ingeniería, márgenes comerciales y descuentos de fabricantes:

- **Seguridad Criptográfica:** Validación en servidor Node.js mediante algoritmo PBKDF2 (`crypto.pbkdf2Sync`) con sales individuales criptográficas SHA-512 y tokens de sesión de 256 bits.
- **Arquitectura de Resiliencia Híbrida (100% Offline):** Si la plataforma se ejecuta de manera local/autónoma mediante `iniciar.bat` o sin servidor backend activo, el motor de cliente conmuta automáticamente a verificación local segura de fallback sin bloquear la operatividad.
- **Control de Roles:**
  - `admin` (Administración General KEV): Acceso irrestricto, configuración de tarifas maestras, gestión de descuentos Siemens e importación/exportación.
  - `ingeniero` (Ingeniería de Proyectos): Levantamiento de HH, configuración de equipos, integración y carta Gantt.
  - `comercial` (Ventas & Propuestas): Análisis de rentabilidad, márgenes de venta y emisión formal de propuestas Word/Excel.
- **Credenciales Predeterminadas:**
  | Perfil | Usuario / Correo | Contraseña Predeterminada |
  | :--- | :--- | :--- |
  | **Administración** | `admin` o `admin@kevprocess.com` | `Kev2026!Admin` *(o botón rápido Admin)* |
  | **Ingeniería** | `ingenieria` o `proyectos@kevprocess.com` | `Kev2026!Proyectos` *(o botón rápido Ingeniería)* |
  | **Comercial** | `comercial` o `comercial@kevprocess.com` | `Kev2026!Comercial` *(o botón rápido Comercial)* |
- **Gestión de Sesión:** Persistencia configurable ("Recordar sesión en este equipo") y botón de cierre de sesión con avatar dinámico en el encabezado superior.

---

## 🆕 Historial de Versiones

### Versión 1.2.0 (Septiembre 2026)
- **🔐 Pasarela de Acceso Seguro (Auth Gateway):** Pantalla de bienvenida y login previo con verificación criptográfica PBKDF2 y fallback offline.
- **👥 Gestión de Roles y Perfiles:** Soporte para usuarios `admin`, `ingenieria` y `comercial` con badge de usuario y cierre de sesión en encabezado.
- **⚡ Botones de Acceso Rápido:** Inicio de sesión instantáneo de 1-clic para agilizar pruebas operativas y demostraciones en terreno.
- **📦 Almacenamiento Seguro:** Archivo `data/users.json` con hash y salts para administración de cuentas de usuario.

### Versión 1.1.0 (Septiembre 2026)
- **🎨 Rediseño Corporativo Oficial:** Identidad gráfica alineada a `www.kevprocess.com` con paleta Tech Navy (`#0B1121`), KEV Teal (`#1D6A6E`), Tech Cyan (`#00B4D8`) y tipografía Google Fonts `Inter`.
- **📌 Panel Lateral Inteligente:** Barra lateral con autohide (350 ms) y fijación (*Pin*), incorporando fijación de Dólar y UF en tiempo real.
- **⚡ Matriz Dinámica Siemens:** Edición directa de porcentajes de descuento por familia (`XG`, `XD`, `ZF`, etc.) y creación de nuevas categorías con recálculo automático.
- **📅 Carta Gantt y Documento de Oferta:** Programación integrada de hitos con barras de gradiente corporativo e inclusión de campos de texto editables por sección para la emisión del documento Word (`.docx`).
- **🛡️ 100% Offline y Multi-Entorno:** Mantiene compatibilidad total de ejecución local con `iniciar.bat` o mediante servidor web (IIS, Docker, Linux/PM2).
