"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";

interface ExamResult {
  id: string;
  examId: string;
  materialId: string;
  materialName: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedDate: string;
  timeSpent: number;
  type: string;
}

interface StudyMaterial {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  examCount: number;
}

interface AnalyticsData {
  totalExams: number;
  averageScore: number;
  totalStudyTime: number;
  bestSubject: string;
  weakestSubject: string;
  currentStreak: number;
  totalMaterials: number;
}

export default function AnalyticsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalExams: 0,
    averageScore: 0,
    totalStudyTime: 0,
    bestSubject: '',
    weakestSubject: '',
    currentStreak: 0,
    totalMaterials: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Cargar resultados
    const savedResults = localStorage.getItem('exam-results');
    const savedMaterials = localStorage.getItem('study-materials');
    
    if (savedResults) {
      const resultsData = JSON.parse(savedResults);
      setResults(resultsData);
      calculateAnalytics(resultsData);
    }
    
    if (savedMaterials) {
      const materialsData = JSON.parse(savedMaterials);
      setMaterials(materialsData);
    }
  };

  const calculateAnalytics = (resultsData: ExamResult[]) => {
    if (resultsData.length === 0) return;

    const totalExams = resultsData.length;
    const averageScore = Math.round(
      resultsData.reduce((sum, result) => sum + result.percentage, 0) / totalExams
    );
    const totalStudyTime = Math.round(
      resultsData.reduce((sum, result) => sum + result.timeSpent, 0) / 60 // Convertir a minutos
    );

    // Encontrar mejor y peor materia
    const materialStats = resultsData.reduce((acc, result) => {
      if (!acc[result.materialName]) {
        acc[result.materialName] = { total: 0, count: 0, average: 0 };
      }
      acc[result.materialName].total += result.percentage;
      acc[result.materialName].count += 1;
      acc[result.materialName].average = acc[result.materialName].total / acc[result.materialName].count;
      return acc;
    }, {} as Record<string, { total: number; count: number; average: number }>);

    const materialEntries = Object.entries(materialStats);
    const bestSubject = materialEntries.reduce((best, current) => 
      current[1].average > best[1].average ? current : best, materialEntries[0]
    )?.[0] || '';

    const weakestSubject = materialEntries.reduce((worst, current) => 
      current[1].average < worst[1].average ? current : worst, materialEntries[0]
    )?.[0] || '';

    // Calcular racha actual
    const sortedResults = [...resultsData].sort((a, b) => 
      new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    );
    
    let currentStreak = 0;
    for (const result of sortedResults) {
      if (result.percentage >= 70) {
        currentStreak++;
      } else {
        break;
      }
    }

    setAnalytics({
      totalExams,
      averageScore,
      totalStudyTime,
      bestSubject,
      weakestSubject,
      currentStreak,
      totalMaterials: materials.length
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 70) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    return 'destructive';
  };

  const getRecentResults = () => {
    return [...results]
      .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
      .slice(0, 10);
  };

  const getMaterialAnalytics = () => {
    const materialStats = results.reduce((acc, result) => {
      if (!acc[result.materialId]) {
        acc[result.materialId] = {
          name: result.materialName,
          totalExams: 0,
          averageScore: 0,
          scores: [],
          bestScore: 0,
          worstScore: 100,
          totalTime: 0
        };
      }
      acc[result.materialId].totalExams += 1;
      acc[result.materialId].scores.push(result.percentage);
      acc[result.materialId].bestScore = Math.max(acc[result.materialId].bestScore, result.percentage);
      acc[result.materialId].worstScore = Math.min(acc[result.materialId].worstScore, result.percentage);
      acc[result.materialId].totalTime += result.timeSpent;
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios
    Object.values(materialStats).forEach((stat: any) => {
      stat.averageScore = Math.round(stat.scores.reduce((sum: number, score: number) => sum + score, 0) / stat.scores.length);
    });

    return Object.values(materialStats);
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics de Estudio</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analiza tu progreso y rendimiento</p>
              </div>
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {results.length > 0 ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exámenes realizados</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalExams}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-xl">📊</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio general</p>
                      <p className={`text-2xl font-bold ${getScoreColor(analytics.averageScore)}`}>
                        {analytics.averageScore}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 text-xl">🎯</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo total estudiado</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(analytics.totalStudyTime / 60)}h
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 text-xl">⏱️</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Racha actual</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.currentStreak}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 dark:text-orange-400 text-xl">🔥</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="results">Resultados</TabsTrigger>
                <TabsTrigger value="materials">Por Material</TabsTrigger>
                <TabsTrigger value="progress">Progreso</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mejor y peor materia */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rendimiento por materia</CardTitle>
                      <CardDescription>
                        Tu mejor y peor rendimiento académico
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics.bestSubject && (
                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                              <span className="text-green-600 dark:text-green-400">🏆</span>
                            </div>
                            <div>
                              <p className="font-medium text-green-900 dark:text-green-100">Mejor materia</p>
                              <p className="text-sm text-green-700 dark:text-green-300">{analytics.bestSubject}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analytics.weakestSubject && analytics.weakestSubject !== analytics.bestSubject && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                              <span className="text-yellow-600 dark:text-yellow-400">📚</span>
                            </div>
                            <div>
                              <p className="font-medium text-yellow-900 dark:text-yellow-100">Área de mejora</p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">{analytics.weakestSubject}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Progreso reciente */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Actividad reciente</CardTitle>
                      <CardDescription>
                        Tus últimos resultados de exámenes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {getRecentResults().slice(0, 5).map((result) => (
                          <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {result.examTitle}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(result.completedDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={getScoreBadgeVariant(result.percentage)}>
                              {result.percentage}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="results">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Exámenes</CardTitle>
                    <CardDescription>
                      Todos tus resultados de exámenes ordenados por fecha
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getRecentResults().map((result) => (
                        <div key={result.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {result.examTitle}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Material: {result.materialName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(result.completedDate).toLocaleDateString()} • 
                                Tiempo: {formatTime(result.timeSpent)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                                {result.percentage}%
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {result.score}/{result.totalQuestions}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">
                              {result.type}
                            </Badge>
                            <Progress value={result.percentage} className="w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis por Material</CardTitle>
                    <CardDescription>
                      Rendimiento detallado en cada materia de estudio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getMaterialAnalytics().map((material: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {material.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {material.totalExams} examen(es) realizados
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`text-xl font-bold ${getScoreColor(material.averageScore)}`}>
                                {material.averageScore}%
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Promedio</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Mejor resultado:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {material.bestScore}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Peor resultado:</span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {material.worstScore}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Tiempo total:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatTime(material.totalTime)}
                              </span>
                            </div>
                          </div>
                          
                          <Progress value={material.averageScore} className="mt-3" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Objetivos de Estudio</CardTitle>
                      <CardDescription>
                        Tu progreso hacia las metas de aprendizaje
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Meta: 10 exámenes completados</span>
                          <span>{Math.min(analytics.totalExams, 10)}/10</span>
                        </div>
                        <Progress value={(analytics.totalExams / 10) * 100} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Meta: Promedio 85%</span>
                          <span>{analytics.averageScore}/85%</span>
                        </div>
                        <Progress value={(analytics.averageScore / 85) * 100} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Meta: 5 horas de estudio</span>
                          <span>{Math.round(analytics.totalStudyTime / 60)}/5h</span>
                        </div>
                        <Progress value={(analytics.totalStudyTime / 300) * 100} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recomendaciones</CardTitle>
                      <CardDescription>
                        Sugerencias para mejorar tu rendimiento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.averageScore < 70 && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                              📚 Dedica más tiempo al estudio
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                              Tu promedio está por debajo del 70%. Considera revisar los materiales antes de los exámenes.
                            </p>
                          </div>
                        )}

                        {analytics.currentStreak === 0 && analytics.totalExams > 1 && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              🔥 Construye una racha
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Intenta obtener 70% o más en tus próximos exámenes para comenzar una racha.
                            </p>
                          </div>
                        )}

                        {analytics.weakestSubject && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                              🎯 Enfócate en {analytics.weakestSubject}
                            </p>
                            <p className="text-xs text-purple-700 dark:text-purple-300">
                              Esta materia necesita más atención. Considera crear más exámenes de práctica.
                            </p>
                          </div>
                        )}

                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            ✨ ¡Sigue así!
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            La práctica constante es clave para el éxito. Continúa creando y tomando exámenes regularmente.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6">
                <span className="text-gray-400 text-4xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay datos de analytics aún
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Completa algunos exámenes para ver tu progreso y estadísticas de rendimiento
              </p>
              <div className="space-x-4">
                <Link href="/create-exam">
                  <Button>
                    ✏️ Crear primer examen
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button variant="outline">
                    📤 Subir material
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}