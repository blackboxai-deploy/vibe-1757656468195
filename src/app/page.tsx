"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";

interface StudyMaterial {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  examCount: number;
  lastStudied?: string;
}

interface ExamResult {
  id: string;
  materialName: string;
  score: number;
  totalQuestions: number;
  completedDate: string;
  type: string;
}

export default function Dashboard() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [recentResults, setRecentResults] = useState<ExamResult[]>([]);
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalExams: 0,
    averageScore: 0,
    studyStreak: 0
  });

  useEffect(() => {
    // Cargar datos desde localStorage
    const savedMaterials = localStorage.getItem('study-materials');
    const savedResults = localStorage.getItem('exam-results');
    
    if (savedMaterials) {
      const materialsData = JSON.parse(savedMaterials);
      setMaterials(materialsData);
      
      const totalExams = materialsData.reduce((acc: number, material: StudyMaterial) => acc + material.examCount, 0);
      setStats(prev => ({ ...prev, totalMaterials: materialsData.length, totalExams }));
    }
    
    if (savedResults) {
      const resultsData = JSON.parse(savedResults);
      setRecentResults(resultsData.slice(-5)); // Últimos 5 resultados
      
      if (resultsData.length > 0) {
        const avgScore = resultsData.reduce((acc: number, result: ExamResult) => acc + (result.score / result.totalQuestions * 100), 0) / resultsData.length;
        setStats(prev => ({ ...prev, averageScore: Math.round(avgScore) }));
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">StudyAI</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Plataforma Inteligente de Estudio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Bienvenido a tu dashboard de estudio!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Sube tus materiales y genera exámenes personalizados con inteligencia artificial
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/upload">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Subir Material</h3>
                    <p className="text-sm opacity-90">Añade nuevos documentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/library">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Mi Biblioteca</h3>
                    <p className="text-sm opacity-90">Ver mis materiales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/create-exam">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✏️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Crear Examen</h3>
                    <p className="text-sm opacity-90">Generar preguntas IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Analytics</h3>
                    <p className="text-sm opacity-90">Ver mi progreso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Materiales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMaterials}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">📚</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exámenes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalExams}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-xl">✏️</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xl">🎯</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Racha</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.studyStreak} días</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-xl">🔥</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Materiales Recientes
                <Link href="/library">
                  <Button variant="outline" size="sm">Ver todos</Button>
                </Link>
              </CardTitle>
              <CardDescription>
                Tus últimos materiales de estudio subidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.slice(-3).map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400">📄</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{material.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {material.type} • {new Date(material.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{material.examCount} exámenes</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📚</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No hay materiales aún</p>
                  <Link href="/upload">
                    <Button>Subir primer material</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resultados Recientes
                <Link href="/analytics">
                  <Button variant="outline" size="sm">Ver todos</Button>
                </Link>
              </CardTitle>
              <CardDescription>
                Tus últimos resultados de exámenes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400">✅</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{result.materialName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {result.type} • {new Date(result.completedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {result.score}/{result.totalQuestions}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round((result.score / result.totalQuestions) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">🎯</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No hay resultados aún</p>
                  <Link href="/create-exam">
                    <Button>Crear primer examen</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        {materials.length === 0 && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">¡Empecemos!</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Sigue estos pasos para comenzar tu experiencia de estudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Sube tu material de estudio</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">PDFs, documentos de Word o texto plano</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">La IA analiza tu contenido</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Extracción automática de conceptos clave</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Genera exámenes personalizados</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Preguntas adaptadas a tu material</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}