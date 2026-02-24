export const openPdfWithTitle = async (pdfUrl: string, title: string) => {
  try {
    // 1. Mostrar estado de carga usando window open con mensaje
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      console.error("El navegador bloqueó la ventana emergente.");
      // Fallback
      window.open(pdfUrl, '_blank');
      return;
    }

    // Preparar UI de carga
    newWindow.document.write(`
      <html>
        <head>
          <title>Cargando ${title}...</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f3f4f6; font-family: system-ui, sans-serif; }
            .loader { border: 4px solid #e5e7eb; border-top: 4px solid #0ea5e9; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; mb-4; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .container { text-align: center; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loader" style="margin: 0 auto 16px auto;"></div>
            <p>Descargando reporte seguro...</p>
          </div>
        </body>
      </html>
    `);

    // 2. Hacer fetch al PDF real
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error("No se pudo cargar el PDF");
    const blob = await response.blob();

    // 3. Crear Blob URL
    const objectUrl = URL.createObjectURL(blob);

    // 4. Inyectar iframe con el PDF y establecer el title definitivo
    newWindow.document.open();
    newWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${objectUrl}#toolbar=1&navpanes=0&scrollbar=1"></iframe>
        </body>
      </html>
    `);
    newWindow.document.close();

    // 5. Liberar URL cuando la ventana se cierre
    const timer = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(timer);
        URL.revokeObjectURL(objectUrl);
      }
    }, 1000);

  } catch (error) {
    console.error("Error al cargar PDF:", error);
    // Fallback a abrir ruteado directo
    window.open(pdfUrl, '_blank');
  }
};
