"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  content?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const supportedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const validFiles = newFiles.filter(file => {
      if (!supportedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
        console.error(`Tipo de archivo no soportado: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.error(`Archivo muy grande: ${file.name} (máximo 10MB)`);
        return false;
      }
      return true;
    });

    const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
    
    // Procesar archivos automáticamente
    uploadedFiles.forEach(processFile);
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadedFile.id ? { ...f, status: 'processing', progress: 25 } : f
    ));

    try {
      // Simular procesamiento de archivo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id ? { ...f, progress: 50 } : f
      ));

      // Leer contenido del archivo
      let content = '';
      if (uploadedFile.file.type === 'text/plain' || uploadedFile.file.name.endsWith('.txt')) {
        content = await uploadedFile.file.text();
      } else if (uploadedFile.file.type === 'application/pdf') {
        content = 'Contenido PDF procesado...'; // En una implementación real, se usaría una librería de PDF
      } else {
        content = 'Documento procesado...';
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id ? { 
          ...f, 
          content, 
          status: 'completed', 
          progress: 100 
        } : f
      ));

      console.log(`Archivo procesado: ${uploadedFile.name}`);
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id ? { ...f, status: 'error', progress: 0 } : f
      ));
      console.error(`Error procesando: ${uploadedFile.name}`);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const saveToLibrary = async () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    
    if (completedFiles.length === 0) {
      console.error('No hay archivos procesados para guardar');
      return;
    }

    setIsProcessing(true);

    try {
      // Obtener materiales existentes
      const existingMaterials = JSON.parse(localStorage.getItem('study-materials') || '[]');
      
      // Crear nuevos materiales
      const newMaterials = completedFiles.map(file => ({
        id: file.id,
        name: file.name.replace(/\.[^/.]+$/, ''), // Quitar extensión
        type: file.type,
        uploadDate: new Date().toISOString(),
        examCount: 0,
        content: file.content,
        originalFileName: file.name,
        size: file.size
      }));

      // Guardar en localStorage
      localStorage.setItem('study-materials', JSON.stringify([...existingMaterials, ...newMaterials]));
      
      console.log(`${newMaterials.length} material(es) guardado(s) en tu biblioteca`);
      
      // Redirigir a la biblioteca
      setTimeout(() => {
        router.push('/library');
      }, 1500);
      
    } catch (error) {
      console.error('Error guardando los materiales');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">← Volver</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subir Material</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Añade nuevos documentos a tu biblioteca</p>
              </div>
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subir Archivos</CardTitle>
            <CardDescription>
              Soporta PDF, Word (.docx), y archivos de texto (.txt). Máximo 10MB por archivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-blue-600 dark:text-blue-400 text-3xl">📁</span>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    PDF, Word, TXT • Máximo 10MB
                  </p>
                </div>
                <div>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button asChild>
                      <span>Seleccionar Archivos</span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        {files.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Archivos Subidos</CardTitle>
                  <CardDescription>
                    {files.length} archivo(s) • {files.filter(f => f.status === 'completed').length} procesado(s)
                  </CardDescription>
                </div>
                {files.some(f => f.status === 'completed') && (
                  <Button 
                    onClick={saveToLibrary} 
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? 'Guardando...' : 'Guardar en Biblioteca'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400">
                            {file.type === 'application/pdf' ? '📄' : 
                             file.type.includes('word') ? '📝' : '📋'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(file.size)} • {file.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            file.status === 'completed' ? 'default' :
                            file.status === 'processing' ? 'secondary' :
                            file.status === 'error' ? 'destructive' : 'outline'
                          }
                        >
                          {file.status === 'completed' ? 'Completado' :
                           file.status === 'processing' ? 'Procesando' :
                           file.status === 'error' ? 'Error' : 'Pendiente'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                    
                    {file.status === 'processing' && (
                      <div className="space-y-2">
                        <Progress value={file.progress} className="w-full" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Procesando archivo... {file.progress}%
                        </p>
                      </div>
                    )}

                    {file.status === 'completed' && file.content && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                          Vista previa del contenido:
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 line-clamp-3">
                          {file.content.substring(0, 200)}...
                        </p>
                      </div>
                    )}

                    {file.status === 'error' && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Error procesando el archivo. Intenta subirlo nuevamente.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">1️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sube tus archivos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Arrastra y suelta o selecciona tus materiales de estudio
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 dark:text-green-400 text-xl">2️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Procesamiento automático</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  La IA extrae y analiza el contenido de tus documentos
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 dark:text-purple-400 text-xl">3️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Listo para estudiar</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Genera exámenes personalizados basados en tu contenido
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}