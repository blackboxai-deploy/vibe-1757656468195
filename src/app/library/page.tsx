"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";

interface StudyMaterial {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  examCount: number;
  content?: string;
  originalFileName: string;
  size: number;
  lastStudied?: string;
}

export default function LibraryPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery]);

  const loadMaterials = () => {
    const savedMaterials = localStorage.getItem('study-materials');
    if (savedMaterials) {
      const materialsData = JSON.parse(savedMaterials);
      setMaterials(materialsData);
    }
  };

  const filterMaterials = () => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter(material =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMaterials(filtered);
    }
  };

  const deleteMaterial = (id: string) => {
    const updatedMaterials = materials.filter(material => material.id !== id);
    setMaterials(updatedMaterials);
    localStorage.setItem('study-materials', JSON.stringify(updatedMaterials));
    console.log('Material eliminado correctamente');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string, fileName: string) => {
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) return '📝';
    if (type === 'text/plain' || fileName.endsWith('.txt')) return '📋';
    return '📄';
  };

  const getFileTypeName = (type: string, fileName: string) => {
    if (type === 'application/pdf') return 'PDF';
    if (type.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) return 'Word';
    if (type === 'text/plain' || fileName.endsWith('.txt')) return 'Texto';
    return 'Documento';
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Biblioteca</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestiona tus materiales de estudio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/upload">
                <Button>+ Añadir Material</Button>
              </Link>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar en tu biblioteca</CardTitle>
            <CardDescription>
              Encuentra rápidamente tus materiales de estudio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre de archivo o material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        {filteredMaterials.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tus Materiales ({filteredMaterials.length})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery ? `Mostrando resultados para "${searchQuery}"` : 'Todos tus materiales de estudio'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-xl">
                            {getFileTypeIcon(material.type, material.originalFileName)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{material.name}</CardTitle>
                          <CardDescription className="truncate">
                            {material.originalFileName}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                      <Badge variant="secondary">
                        {getFileTypeName(material.type, material.originalFileName)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tamaño:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatFileSize(material.size)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subido:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(material.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Exámenes:</span>
                      <Badge variant={material.examCount > 0 ? "default" : "outline"}>
                        {material.examCount}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                          >
                            👁️ Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{material.name}</DialogTitle>
                            <DialogDescription>
                              {material.originalFileName} • {getFileTypeName(material.type, material.originalFileName)} • {formatFileSize(material.size)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Vista previa del contenido:</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {material.content ? material.content.substring(0, 2000) + (material.content.length > 2000 ? '...' : '') : 'No hay vista previa disponible'}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Link href={`/create-exam?materialId=${material.id}`}>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          ✏️ Examinar
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el material "{material.name}" y todos los exámenes asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMaterial(material.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6">
                <span className="text-gray-400 text-4xl">
                  {searchQuery ? '🔍' : '📚'}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No se encontraron resultados' : 'No hay materiales en tu biblioteca'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery 
                  ? `No encontramos materiales que coincidan con "${searchQuery}"`
                  : 'Comienza subiendo tu primer material de estudio para generar exámenes personalizados'
                }
              </p>
              <div className="space-x-4">
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Ver todos los materiales
                  </Button>
                ) : (
                  <Link href="/upload">
                    <Button>
                      📤 Subir primer material
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}