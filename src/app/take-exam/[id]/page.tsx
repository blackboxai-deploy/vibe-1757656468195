"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { toast } from "sonner";

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended' | 'fill-blanks';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Exam {
  id: string;
  materialId: string;
  materialName: string;
  title: string;
  questions: Question[];
  config: {
    difficulty: string;
    questionCount: number;
    timeLimit: number;
  };
  createdDate: string;
  status: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
}

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isExamStarted && timeRemaining > 0 && !isExamCompleted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExamStarted, timeRemaining, isExamCompleted]);

  const loadExam = () => {
    const savedExams = localStorage.getItem('generated-exams');
    if (savedExams) {
      const exams = JSON.parse(savedExams);
      const foundExam = exams.find((e: Exam) => e.id === examId);
      if (foundExam) {
        setExam(foundExam);
        setTimeRemaining(foundExam.config.timeLimit * 60); // Convertir a segundos
        // Inicializar respuestas vacías
        const initialAnswers = foundExam.questions.map((q: Question) => ({
          questionId: q.id,
          answer: '',
          isCorrect: undefined
        }));
        setUserAnswers(initialAnswers);
      } else {
        console.error('Examen no encontrado');
        router.push('/');
      }
    }
  };

  const startExam = () => {
    setIsExamStarted(true);
    console.log('¡Examen iniciado! El tiempo corre.');
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => prev.map(ua => 
      ua.questionId === questionId 
        ? { ...ua, answer }
        : ua
    ));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (exam?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitExam = async () => {
    if (!exam) return;

    setIsExamCompleted(true);
    
    // Evaluar respuestas
    const evaluatedAnswers = userAnswers.map(ua => {
      const question = exam.questions.find(q => q.id === ua.questionId);
      if (!question) return ua;

      let isCorrect = false;
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        isCorrect = ua.answer === question.correctAnswer;
      } else if (question.type === 'fill-blanks') {
        // Evaluación simple para fill-blanks
        isCorrect = ua.answer.toLowerCase().includes(question.correctAnswer.toLowerCase());
      } else {
        // Para preguntas abiertas, asumimos correcto si tiene contenido
        isCorrect = ua.answer.trim().length > 10;
      }

      return { ...ua, isCorrect };
    });

    setUserAnswers(evaluatedAnswers);

    // Calcular score
    const correctAnswers = evaluatedAnswers.filter(ua => ua.isCorrect).length;
    const totalQuestions = exam.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Guardar resultado
    const result = {
      id: Math.random().toString(36).substr(2, 9),
      examId: exam.id,
      materialId: exam.materialId,
      materialName: exam.materialName,
      examTitle: exam.title,
      score: correctAnswers,
      totalQuestions,
      percentage: score,
      answers: evaluatedAnswers,
      completedDate: new Date().toISOString(),
      timeSpent: (exam.config.timeLimit * 60) - timeRemaining,
      type: exam.config.difficulty
    };

    const existingResults = JSON.parse(localStorage.getItem('exam-results') || '[]');
    localStorage.setItem('exam-results', JSON.stringify([...existingResults, result]));

    console.log(`¡Examen completado! Puntuación: ${score}%`);
    setShowResults(true);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentAnswer = () => {
    if (!exam) return '';
    const currentQuestion = exam.questions[currentQuestionIndex];
    const userAnswer = userAnswers.find(ua => ua.questionId === currentQuestion.id);
    return userAnswer?.answer || '';
  };

  const getAnsweredCount = () => {
    return userAnswers.filter(ua => ua.answer.trim() !== '').length;
  };

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">⏳</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Cargando examen...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const correctAnswers = userAnswers.filter(ua => ua.isCorrect).length;
    const score = Math.round((correctAnswers / exam.questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 text-3xl">
                  {score >= 70 ? '🎉' : score >= 50 ? '👍' : '📚'}
                </span>
              </div>
              <CardTitle className="text-2xl">¡Examen Completado!</CardTitle>
              <CardDescription>
                Has terminado: {exam.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {score}%
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {correctAnswers} de {exam.questions.length} respuestas correctas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Tiempo utilizado</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {formatTime((exam.config.timeLimit * 60) - timeRemaining)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Dificultad</p>
                  <p className="font-semibold text-purple-900 dark:text-purple-100 capitalize">
                    {exam.config.difficulty}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Resumen por pregunta:</h3>
                <div className="space-y-2">
                  {exam.questions.map((question, index) => {
                    const userAnswer = userAnswers.find(ua => ua.questionId === question.id);
                    return (
                      <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            userAnswer?.isCorrect 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                              : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                          }`}>
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white truncate max-w-md">
                            {question.question}
                          </p>
                        </div>
                        <Badge variant={userAnswer?.isCorrect ? 'default' : 'destructive'}>
                          {userAnswer?.isCorrect ? '✓' : '✗'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => router.push('/analytics')} 
                  className="flex-1"
                >
                  Ver Analytics
                </Button>
                <Button 
                  onClick={() => router.push('/')} 
                  variant="outline"
                  className="flex-1"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!isExamStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 text-3xl">📝</span>
              </div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <CardDescription>
                Material: {exam.materialName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preguntas</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {exam.questions.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tiempo límite</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {exam.config.timeLimit} min
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instrucciones:</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Lee cada pregunta cuidadosamente antes de responder</li>
                  <li>• Puedes navegar entre preguntas usando los botones</li>
                  <li>• El examen se enviará automáticamente cuando termine el tiempo</li>
                  <li>• Asegúrate de responder todas las preguntas</li>
                </ul>
              </div>

              <div className="text-center">
                <Button 
                  onClick={startExam}
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 px-8"
                >
                  🚀 Comenzar Examen
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  El cronómetro iniciará cuando presiones el botón
                </p>
              </div>

              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                >
                  ← Volver al dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header con timer */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Pregunta {currentQuestionIndex + 1} de {exam.questions.length}
              </Badge>
              <Badge variant="secondary">
                {getAnsweredCount()}/{exam.questions.length} respondidas
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                timeRemaining < 300 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
              }`}>
                ⏰ {formatTime(timeRemaining)}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Finalizar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Finalizar examen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Has respondido {getAnsweredCount()} de {exam.questions.length} preguntas. 
                      ¿Estás seguro de que quieres finalizar el examen ahora?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continuar</AlertDialogCancel>
                    <AlertDialogAction onClick={submitExam}>
                      Finalizar examen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {currentQuestion.question}
                </CardTitle>
                <CardDescription className="mt-2">
                  Tipo: {
                    currentQuestion.type === 'multiple-choice' ? 'Opción múltiple' :
                    currentQuestion.type === 'true-false' ? 'Verdadero/Falso' :
                    currentQuestion.type === 'open-ended' ? 'Pregunta abierta' :
                    'Completar espacios'
                  }
                </CardDescription>
              </div>
              <Badge variant={getCurrentAnswer() ? 'default' : 'outline'}>
                {getCurrentAnswer() ? 'Respondida' : 'Sin responder'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Opciones de respuesta */}
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <RadioGroup 
                value={getCurrentAnswer()} 
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === 'true-false' && (
              <RadioGroup 
                value={getCurrentAnswer()} 
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <RadioGroupItem value="Verdadero" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">
                      ✅ Verdadero
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <RadioGroupItem value="Falso" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">
                      ❌ Falso
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {(currentQuestion.type === 'open-ended' || currentQuestion.type === 'fill-blanks') && (
              <div className="space-y-2">
                <Label htmlFor="open-answer">Tu respuesta:</Label>
                <Textarea
                  id="open-answer"
                  placeholder={
                    currentQuestion.type === 'open-ended' 
                      ? "Escribe tu respuesta detallada aquí..." 
                      : "Completa los espacios en blanco..."
                  }
                  value={getCurrentAnswer()}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={currentQuestion.type === 'open-ended' ? 6 : 3}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentQuestion.type === 'open-ended' 
                    ? 'Explica tu respuesta con el mayor detalle posible' 
                    : 'Escribe las palabras que completan la frase'}
                </p>
              </div>
            )}

            {/* Navegación */}
            <div className="flex justify-between pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                ← Anterior
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pregunta {currentQuestionIndex + 1} de {exam.questions.length}
                </p>
              </div>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Finalizar Examen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Finalizar examen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Has llegado a la última pregunta. Has respondido {getAnsweredCount()} de {exam.questions.length} preguntas.
                        ¿Estás listo para enviar tu examen?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Revisar</AlertDialogCancel>
                      <AlertDialogAction onClick={submitExam} className="bg-green-600 hover:bg-green-700">
                        Enviar Examen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button 
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === exam.questions.length - 1}
                >
                  Siguiente →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navegación rápida */}
        <Card className="max-w-4xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Navegación Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {exam.questions.map((_, index) => {
                const isAnswered = userAnswers[index]?.answer.trim() !== '';
                const isCurrent = index === currentQuestionIndex;
                return (
                  <Button
                    key={index}
                    variant={isCurrent ? 'default' : isAnswered ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className="aspect-square p-0"
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span>Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                <span>Sin responder</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}