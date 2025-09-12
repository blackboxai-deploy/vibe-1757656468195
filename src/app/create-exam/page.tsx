"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
}

interface ExamConfig {
  materialId: string;
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    openEnded: boolean;
    fillInBlanks: boolean;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timeLimit: number;
  title: string;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended' | 'fill-blanks';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

function CreateExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get('materialId');

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    materialId: materialId || '',
    questionTypes: {
      multipleChoice: true,
      trueFalse: true,
      openEnded: false,
      fillInBlanks: false,
    },
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: 30,
    title: ''
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (materialId && materials.length > 0) {
      const material = materials.find(m => m.id === materialId);
      if (material) {
        setSelectedMaterial(material);
        setExamConfig(prev => ({ 
          ...prev, 
          materialId: material.id,
          title: `Examen de ${material.name}`
        }));
      }
    }
  }, [materialId, materials]);

  const loadMaterials = () => {
    const savedMaterials = localStorage.getItem('study-materials');
    if (savedMaterials) {
      const materialsData = JSON.parse(savedMaterials);
      setMaterials(materialsData);
    }
  };

  const handleMaterialSelect = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      setSelectedMaterial(material);
      setExamConfig(prev => ({
        ...prev,
        materialId,
        title: `Examen de ${material.name}`
      }));
    }
  };

  const handleQuestionTypeChange = (type: keyof ExamConfig['questionTypes'], checked: boolean) => {
    setExamConfig(prev => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: checked
      }
    }));
  };

  const generateExam = async () => {
    if (!selectedMaterial) {
      console.error('Selecciona un material para crear el examen');
      return;
    }

    const enabledTypes = Object.entries(examConfig.questionTypes)
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);

    if (enabledTypes.length === 0) {
      console.error('Selecciona al menos un tipo de pregunta');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simular proceso de generación con IA
      const questions: Question[] = [];
      const contentWords = selectedMaterial.content?.split(' ') || [];
      const sampleConcepts = contentWords.slice(0, 50).join(' ');

      for (let i = 0; i < examConfig.questionCount; i++) {
        setGenerationProgress((i / examConfig.questionCount) * 100);
        await new Promise(resolve => setTimeout(resolve, 200)); // Simular procesamiento

        // Generar pregunta según configuración
        const typeIndex = i % enabledTypes.length;
        const questionType = enabledTypes[typeIndex];
        
        let question: Question;
        
        switch (questionType) {
          case 'multipleChoice':
            question = {
              id: `q_${i}_mc`,
              type: 'multiple-choice',
              question: `Pregunta ${i + 1}: ¿Cuál de las siguientes afirmaciones es correcta sobre "${sampleConcepts.split(' ')[i % 10]}"?`,
              options: [
                'Opción A: Esta es la respuesta correcta',
                'Opción B: Esta es incorrecta',
                'Opción C: Esta también es incorrecta',
                'Opción D: Esta es falsa'
              ],
              correctAnswer: 'Opción A: Esta es la respuesta correcta',
              explanation: 'Explicación detallada de por qué la opción A es correcta...'
            };
            break;
            
          case 'trueFalse':
            question = {
              id: `q_${i}_tf`,
              type: 'true-false',
              question: `Pregunta ${i + 1}: El concepto "${sampleConcepts.split(' ')[i % 10]}" es fundamental en este material.`,
              options: ['Verdadero', 'Falso'],
              correctAnswer: 'Verdadero',
              explanation: 'Esta afirmación es verdadera porque...'
            };
            break;
            
          case 'openEnded':
            question = {
              id: `q_${i}_oe`,
              type: 'open-ended',
              question: `Pregunta ${i + 1}: Explica en tus propias palabras qué entiendes por "${sampleConcepts.split(' ')[i % 10]}".`,
              correctAnswer: 'Respuesta modelo: Una explicación completa debería incluir...',
              explanation: 'Criterios de evaluación: La respuesta debe incluir...'
            };
            break;
            
          default:
            question = {
              id: `q_${i}_fb`,
              type: 'fill-blanks',
              question: `Pregunta ${i + 1}: Completa la frase: "El concepto de _______ es importante porque _______."`,
              correctAnswer: `${sampleConcepts.split(' ')[i % 10]}, define aspectos fundamentales`,
              explanation: 'Las palabras correctas son importantes porque...'
            };
        }
        
        questions.push(question);
      }

      setGenerationProgress(100);

      // Crear el examen
      const examId = Math.random().toString(36).substr(2, 9);
      const newExam = {
        id: examId,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        title: examConfig.title,
        questions,
        config: examConfig,
        createdDate: new Date().toISOString(),
        status: 'ready'
      };

      // Guardar el examen
      const existingExams = JSON.parse(localStorage.getItem('generated-exams') || '[]');
      localStorage.setItem('generated-exams', JSON.stringify([...existingExams, newExam]));

      // Actualizar contador de exámenes del material
      const updatedMaterials = materials.map(m => 
        m.id === selectedMaterial.id 
          ? { ...m, examCount: m.examCount + 1 }
          : m
      );
      localStorage.setItem('study-materials', JSON.stringify(updatedMaterials));

      console.log('¡Examen generado exitosamente!');
      
      setTimeout(() => {
        router.push(`/take-exam/${examId}`);
      }, 1500);

    } catch (error) {
      console.error('Error generando el examen. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crear Examen</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Genera preguntas personalizadas con IA</p>
              </div>
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isGenerating ? (
          // Pantalla de generación
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>🧠 Generando tu examen...</CardTitle>
              <CardDescription>
                La IA está analizando tu material y creando preguntas personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <span className="text-blue-600 dark:text-blue-400 text-3xl">⚡</span>
              </div>
              
              <div className="space-y-2">
                <Progress value={generationProgress} className="w-full" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(generationProgress)}% completado
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  Procesando: {selectedMaterial?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Creando {examConfig.questionCount} preguntas
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuración */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selección de Material */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Seleccionar Material</CardTitle>
                  <CardDescription>
                    Elige el material del cual quieres generar el examen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {materials.length > 0 ? (
                    <div className="space-y-4">
                      <Select 
                        value={examConfig.materialId} 
                        onValueChange={handleMaterialSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un material..." />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              <div className="flex items-center space-x-2">
                                <span>
                                  {material.type === 'application/pdf' ? '📄' : 
                                   material.type.includes('word') ? '📝' : '📋'}
                                </span>
                                <span>{material.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedMaterial && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 text-xl">
                                {selectedMaterial.type === 'application/pdf' ? '📄' : 
                                 selectedMaterial.type.includes('word') ? '📝' : '📋'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                {selectedMaterial.name}
                              </h3>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {selectedMaterial.originalFileName}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">
                                  {selectedMaterial.examCount} exámenes creados
                                </Badge>
                                <Badge variant="outline">
                                  Subido: {new Date(selectedMaterial.uploadDate).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-400 text-2xl">📚</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No tienes materiales en tu biblioteca
                      </p>
                      <Link href="/upload">
                        <Button>Subir material</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Configuración del Examen */}
              {selectedMaterial && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>2. Título del Examen</CardTitle>
                      <CardDescription>
                        Dale un nombre descriptivo a tu examen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Input
                        type="text"
                        value={examConfig.title}
                        onChange={(e) => setExamConfig(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ej: Examen de Matemáticas - Capítulo 1"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>3. Tipos de Preguntas</CardTitle>
                      <CardDescription>
                        Selecciona qué tipos de preguntas quieres incluir
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="multipleChoice"
                            checked={examConfig.questionTypes.multipleChoice}
                            onCheckedChange={(checked) => 
                              handleQuestionTypeChange('multipleChoice', !!checked)
                            }
                          />
                          <Label htmlFor="multipleChoice" className="flex-1">
                            <div>
                              <p className="font-medium">Opción Múltiple</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Preguntas con 4 opciones de respuesta
                              </p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="trueFalse"
                            checked={examConfig.questionTypes.trueFalse}
                            onCheckedChange={(checked) => 
                              handleQuestionTypeChange('trueFalse', !!checked)
                            }
                          />
                          <Label htmlFor="trueFalse" className="flex-1">
                            <div>
                              <p className="font-medium">Verdadero/Falso</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Preguntas de afirmación verdadera o falsa
                              </p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="openEnded"
                            checked={examConfig.questionTypes.openEnded}
                            onCheckedChange={(checked) => 
                              handleQuestionTypeChange('openEnded', !!checked)
                            }
                          />
                          <Label htmlFor="openEnded" className="flex-1">
                            <div>
                              <p className="font-medium">Preguntas Abiertas</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Respuestas libres evaluadas por IA
                              </p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fillInBlanks"
                            checked={examConfig.questionTypes.fillInBlanks}
                            onCheckedChange={(checked) => 
                              handleQuestionTypeChange('fillInBlanks', !!checked)
                            }
                          />
                          <Label htmlFor="fillInBlanks" className="flex-1">
                            <div>
                              <p className="font-medium">Completar Espacios</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Oraciones con palabras faltantes
                              </p>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>4. Configuración Avanzada</CardTitle>
                      <CardDescription>
                        Personaliza la dificultad y cantidad de preguntas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium">Dificultad</Label>
                        <Select 
                          value={examConfig.difficulty} 
                          onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                            setExamConfig(prev => ({ ...prev, difficulty: value }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">🟢 Fácil - Conceptos básicos</SelectItem>
                            <SelectItem value="medium">🟡 Medio - Conocimiento general</SelectItem>
                            <SelectItem value="hard">🔴 Difícil - Análisis profundo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Número de preguntas: {examConfig.questionCount}
                        </Label>
                        <Slider
                          value={[examConfig.questionCount]}
                          onValueChange={(value) => 
                            setExamConfig(prev => ({ ...prev, questionCount: value[0] }))
                          }
                          max={50}
                          min={5}
                          step={5}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span>5 preguntas</span>
                          <span>50 preguntas</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Tiempo límite: {examConfig.timeLimit} minutos
                        </Label>
                        <Slider
                          value={[examConfig.timeLimit]}
                          onValueChange={(value) => 
                            setExamConfig(prev => ({ ...prev, timeLimit: value[0] }))
                          }
                          max={120}
                          min={10}
                          step={5}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span>10 min</span>
                          <span>2 horas</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Resumen y Generar */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumen del Examen</CardTitle>
                  <CardDescription>
                    Revisa la configuración antes de generar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedMaterial ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Material:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedMaterial.name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Título:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {examConfig.title || 'Sin título'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Preguntas:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {examConfig.questionCount} preguntas
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dificultad:</p>
                        <Badge variant={
                          examConfig.difficulty === 'easy' ? 'secondary' :
                          examConfig.difficulty === 'medium' ? 'default' : 'destructive'
                        }>
                          {examConfig.difficulty === 'easy' ? '🟢 Fácil' :
                           examConfig.difficulty === 'medium' ? '🟡 Medio' : '🔴 Difícil'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {examConfig.timeLimit} minutos
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tipos de preguntas:</p>
                        <div className="space-y-1">
                          {examConfig.questionTypes.multipleChoice && (
                            <Badge variant="outline" className="mr-1 mb-1">✓ Opción múltiple</Badge>
                          )}
                          {examConfig.questionTypes.trueFalse && (
                            <Badge variant="outline" className="mr-1 mb-1">✓ V/F</Badge>
                          )}
                          {examConfig.questionTypes.openEnded && (
                            <Badge variant="outline" className="mr-1 mb-1">✓ Abiertas</Badge>
                          )}
                          {examConfig.questionTypes.fillInBlanks && (
                            <Badge variant="outline" className="mr-1 mb-1">✓ Completar</Badge>
                          )}
                        </div>
                      </div>

                      <Button 
                        onClick={generateExam}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={!examConfig.title}
                      >
                        🧠 Generar Examen con IA
                      </Button>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        La generación puede tomar 1-2 minutos
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span className="text-gray-400 text-xl">📋</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Selecciona un material para continuar
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-blue-600 dark:text-blue-400 text-2xl">⚡</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <CreateExamContent />
    </Suspense>
  );
}