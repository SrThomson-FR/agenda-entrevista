# Agenda de entrevistas · Módulo 3 · FIMLM

Página para que cada estudiante elija el día y la hora de su entrevista de práctica (30 minutos).

- **Página:** `index.html` + `config.js` (se publica con GitHub Pages).
- **Guardado:** `apps-script/Code.gs` (Google Apps Script + una hoja de Google). Guarda las reservas, evita que dos personas tomen la misma hora y no muestra a nadie quién reservó qué.
- Horarios: martes 27, miércoles 28 y jueves 29 de octubre (un cupo por hora) y viernes 30 (dos cupos por hora), a las 6:00, 6:30 y 7:00 pm. Cierra el viernes 30 a las 8:00 pm.
- Panel del profesor: al final de la página, con el código definido en `ADMIN_CODE` (en `Code.gs`).

## Puesta en marcha (una sola vez)

1. Crea una hoja de cálculo nueva en Google Sheets (por ejemplo "Agenda entrevistas Módulo 3").
2. Menú **Extensiones → Apps Script**. Borra lo que haya y pega todo el contenido de `apps-script/Code.gs`. Guarda.
3. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**. Autoriza los permisos cuando Google los pida.
4. Copia la URL que termina en `/exec` y pégala en `config.js`, en `API_URL`.
5. En GitHub: **Settings → Pages → Deploy from a branch → main / (root)**.
6. Haz una reserva de prueba y revisa que aparezca en la pestaña `Reservas` de la hoja. Luego borra esa fila.

Si cambias `Code.gs` después, usa **Implementar → Administrar implementaciones → Editar → Nueva versión**; la URL no cambia.

## Reglas del guardado

- Si dos personas guardan la misma hora a la vez, gana la primera. La segunda ve el aviso "Esa hora se acaba de ocupar".
- La persona se identifica por su correo: con el mismo correo puede cambiar su propia hora; no puede modificar la de otros.
- La hoja guarda la hora de registro en milisegundos y tiene una columna "Profesor asignado" para que la llenes tú.
