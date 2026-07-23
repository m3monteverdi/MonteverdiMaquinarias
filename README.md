# Monteverdi Maquinarias 🚜

Sistema web premium de control y gestión de maquinaria pesada. Construido sobre arquitectura serverless ligera con **Supabase** y **Vanilla Javascript / CSS**.

Desplegado en: `https://m3monteverdi.github.io/MonteverdiMaquinarias/`

---

## 🚀 Estructura del Proyecto

*   `index.html`: Estructura principal, navegación de pestañas y formularios dinámicos.
*   `styles.css`: Sistema de diseño premium, adaptado a temática industrial (grises oscuros y acentos ámbar/naranja).
*   `app.js`: Lógica de orquestación, cálculo automático de mantenimientos por horas y fechas, alertas y exportación de informes en Excel.
*   `supabase.js`: Inicialización del cliente Supabase con credenciales de tu proyecto.
*   `database/supabase.sql`: Script estructurado para inicializar las tablas en tu base de datos de Supabase.
*   `assets/logo.png`: Logotipo representativo de la empresa.

---

## 🛠️ Configuración Inicial en Supabase

1. Abre tu panel de control de Supabase: [zuygdarjqyolybqocvkb](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta el contenido del archivo `database/supabase.sql` para crear las tablas necesarias (`maquinas`, `maquinistas`, `reportes`, `ots`, `reparaciones`, `servicios_proximos` y `documentos`) y deshabilitar temporalmente las reglas de RLS.
3. Ve a **Storage** en tu panel de Supabase y crea 2 buckets **públicos**:
    *   `fotos` (para las capturas opcionales de los reportes).
    *   `documentos` (para alojar la póliza de seguros y manuales).

---

## ⚙️ Características Incluidas

1.  📊 **Dashboard**: Resumen de estado operativo de las máquinas, ranking de fallas del taller y un centro inteligente de alertas (Avisos de Service/Engrase programados o vencidos y vencimiento de licencias de conducir de los operadores).
2.  📋 **Reportar**: Panel intuitivo con selección del tipo de reporte (Falla, Service, Engrase, Neumáticos, Accesorios). Cuando se selecciona "Service" o "Engrase" y se elige medición "Por horas", el sistema calcula automáticamente el siguiente umbral basándose en la configuración definida.
3.  🔧 **Reparar**: Listado de OTs abiertas donde puedes registrar el taller ejecutor, las tareas realizadas, los repuestos utilizados y dar cierre.
4.  📂 **OT**: Historial de órdenes de trabajo organizadas por estado.
5.  👷 **Maquinistas**: Listado con las fichas de los operadores que detallan su número de teléfono, categoría de carnet, vencimiento del mismo, obra asignada y qué equipos están autorizados a operar.
6.  📄 **Documentos**: Descarga directa de la póliza de flota y los manuales de uso técnicos cargados por el administrador.
7.  ⚙️ **Configuración**: Acceso restringido mediante contraseña (`monteverdi`) para agregar o eliminar máquinas y maquinistas, subir manuales/póliza y exportar un Excel unificado con toda la información.
8.  📱 **Lectura de QR**: Cada máquina permite generar un código QR único desde Configuración. Al imprimirlo y pegarlo en el chasis, cualquier operario que lo escanee con su teléfono será dirigido automáticamente a la pestaña de reportes con la máquina ya preseleccionada.
