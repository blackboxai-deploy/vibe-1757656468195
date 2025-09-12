import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron archivos' },
        { status: 400 }
      );
    }

    const processedFiles = [];

    for (const file of files) {
      try {
        const processedFile = await processFile(file);
        processedFiles.push(processedFile);
      } catch (error) {
        console.error(`Error procesando archivo ${file.name}:`, error);
        processedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          error: 'Error procesando archivo',
          status: 'error'
        });
      }
    }

    return NextResponse.json({
      message: `${processedFiles.length} archivo(s) procesado(s)`,
      files: processedFiles
    });

  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function processFile(file: File) {
  const supportedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!supportedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
    throw new Error(`Tipo de archivo no soportado: ${file.type}`);
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('Archivo muy grande');
  }

  let content = '';
  
  try {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      content = await file.text();
    } else if (file.type === 'application/pdf') {
      // En una implementación real, usarías una librería como pdf-parse
      content = `[PDF procesado: ${file.name}] - Contenido extraído del documento PDF. Este es un texto de ejemplo que representaría el contenido real extraído del archivo PDF subido por el usuario.`;
    } else if (file.type.includes('word') || file.name.match(/\.(doc|docx)$/)) {
      // En una implementación real, usarías una librería como mammoth.js
      content = `[Documento Word procesado: ${file.name}] - Contenido extraído del documento Word. Este es un texto de ejemplo que representaría el contenido real extraído del archivo Word subido por el usuario.`;
    }

    // Validar que se extrajo contenido
    if (!content.trim()) {
      throw new Error('No se pudo extraer contenido del archivo');
    }

    // Simular procesamiento adicional
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: generateFileId(),
      name: file.name.replace(/\.[^/.]+$/, ''), // Quitar extensión
      originalFileName: file.name,
      size: file.size,
      type: file.type,
      content: content.substring(0, 10000), // Limitar a 10k caracteres por rendimiento
      processedDate: new Date().toISOString(),
      status: 'completed',
      wordCount: content.split(/\s+/).length,
      estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200) // 200 palabras/minuto
    };

  } catch (error) {
    throw new Error(`Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

function generateFileId(): string {
  return 'file_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Endpoint GET para obtener información de archivos procesados
export async function GET() {
  return NextResponse.json({
    message: 'API de upload activa',
    supportedTypes: [
      'text/plain (.txt)',
      'application/pdf (.pdf)',
      'application/msword (.doc)',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)'
    ],
    maxSize: '10MB',
    version: '1.0'
  });
}