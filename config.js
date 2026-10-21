// Configuración de la agenda. Pega aquí la URL de la aplicación web de Google Apps Script
// (termina en /exec). Mientras esté vacía, la página funciona en MODO DE PRUEBA y no guarda nada real.
window.AGENDA_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzFa_f_4Fq6tiVlh6wELGXb-81R5wwYaF3qXb5sEPk3sefzt8fu4BsLuGQHIIxuuj8gYg/exec',
  CLOSE_MS: Date.parse('2026-10-30T20:00:00-05:00'),
  CLOSE_TEXT: 'el viernes 30 de octubre a las 8:00 pm',
  TIMES: [
    { id: '1800', label: '6:00 pm', range: '6:00 – 6:30 pm' },
    { id: '1830', label: '6:30 pm', range: '6:30 – 7:00 pm' },
    { id: '1900', label: '7:00 pm', range: '7:00 – 7:30 pm' }
  ],
  DAYS: [
    { id: 'o27', name: 'Martes', num: '27', label: 'Martes 27 de octubre', cap: 1 },
    { id: 'o28', name: 'Miércoles', num: '28', label: 'Miércoles 28 de octubre', cap: 1 },
    { id: 'o29', name: 'Jueves', num: '29', label: 'Jueves 29 de octubre', cap: 1 },
    { id: 'o30', name: 'Viernes', num: '30', label: 'Viernes 30 de octubre', cap: 2 }
  ]
};
