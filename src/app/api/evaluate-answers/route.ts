import { NextRequest, NextResponse } from 'next/server';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended' | 'fill-blanks';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
}

interface EvaluationResult {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number; // 0-1
  feedback: string;
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    const { questions, userAnswers } = await request.json();

    if (!questions || !userAnswers) {
      return NextResponse.json(
        { error: 'Preguntas y respuestas requeridas' },
        { status: 400 }
      );
    }

    const evaluations: EvaluationResult[] = [];

    for (const userAnswer of userAnswers) {
      const question = questions.find((q: Question) => q.id === userAnswer.questionId);
      if (!question) continue;

      const evaluation = await evaluateAnswer(question, userAnswer);
      evaluations.push(evaluation);
    }

    const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
    const averageScore = totalScore / evaluations.length;
    const correctCount = evaluations.filter(evaluation => evaluation.isCorrect).length;

    const result = {
      evaluations,
      summary: {
        totalQuestions: evaluations.length,
        correctAnswers: correctCount,
        incorrectAnswers: evaluations.length - correctCount,
        averageScore: Math.round(averageScore * 100),
        percentage: Math.round((correctCount / evaluations.length) * 100)
      },
      recommendations: generateRecommendations(evaluations)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error evaluating answers:', error);
    return NextResponse.json(
      { error: 'Error evaluando las respuestas' },
      { status: 500 }
    );
  }
}

async function evaluateAnswer(question: Question, userAnswer: UserAnswer): Promise<EvaluationResult> {
  const { type } = question;
  
  switch (type) {
    case 'multiple-choice':
      return evaluateMultipleChoice(question, userAnswer);
      
    case 'true-false':
      return evaluateTrueFalse(question, userAnswer);
      
    case 'open-ended':
      return await evaluateOpenEnded(question, userAnswer);
      
    case 'fill-blanks':
      return evaluateFillBlanks(question, userAnswer);
      
    default:
      throw new Error(`Tipo de pregunta no soportado: ${type}`);
  }
}

function evaluateMultipleChoice(question: Question, userAnswer: UserAnswer): EvaluationResult {
  const isCorrect = userAnswer.answer.trim() === question.correctAnswer.trim();
  
  return {
    questionId: question.id,
    userAnswer: userAnswer.answer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    score: isCorrect ? 1 : 0,
    feedback: isCorrect 
      ? '¡Correcto! Has seleccionado la opción correcta.'
      : `Incorrecto. La respuesta correcta era: "${question.correctAnswer}"`,
    explanation: question.explanation
  };
}

function evaluateTrueFalse(question: Question, userAnswer: UserAnswer): EvaluationResult {
  const isCorrect = userAnswer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
  
  return {
    questionId: question.id,
    userAnswer: userAnswer.answer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    score: isCorrect ? 1 : 0,
    feedback: isCorrect 
      ? '¡Correcto! Tu respuesta es acertada.'
      : `Incorrecto. La respuesta correcta era: ${question.correctAnswer}`,
    explanation: question.explanation
  };
}

async function evaluateOpenEnded(question: Question, userAnswer: UserAnswer): Promise<EvaluationResult> {
  // Simular evaluación con IA de respuesta abierta
  // En una implementación real, se usaría OpenAI para evaluar la calidad de la respuesta
  
  const userText = userAnswer.answer.trim().toLowerCase();
  const expectedKeywords = extractKeywords(question.correctAnswer);
  
  // Evaluación basada en keywords y longitud
  const keywordMatches = expectedKeywords.filter(keyword => 
    userText.includes(keyword.toLowerCase())
  ).length;
  
  const keywordScore = keywordMatches / expectedKeywords.length;
  const lengthScore = Math.min(1, userText.length / 100); // Penalizar respuestas muy cortas
  const finalScore = (keywordScore * 0.7) + (lengthScore * 0.3);
  
  const isCorrect = finalScore >= 0.6;
  
  let feedback = '';
  if (finalScore >= 0.8) {
    feedback = '¡Excelente respuesta! Has demostrado una comprensión profunda del tema.';
  } else if (finalScore >= 0.6) {
    feedback = 'Buena respuesta. Incluyes varios conceptos importantes, pero podrías profundizar más.';
  } else if (finalScore >= 0.3) {
    feedback = 'Respuesta parcialmente correcta. Te falta incluir algunos conceptos clave.';
  } else {
    feedback = 'Respuesta incompleta. Necesitas desarrollar más la respuesta con conceptos del material.';
  }
  
  return {
    questionId: question.id,
    userAnswer: userAnswer.answer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    score: finalScore,
    feedback,
    explanation: question.explanation + ` Conceptos clave identificados: ${keywordMatches}/${expectedKeywords.length}`
  };
}

function evaluateFillBlanks(question: Question, userAnswer: UserAnswer): EvaluationResult {
  const userWords = userAnswer.answer.toLowerCase().split(/[,\s]+/).map(w => w.trim());
  const correctWords = question.correctAnswer.toLowerCase().split(/[,\s]+/).map(w => w.trim());
  
  let matches = 0;
  correctWords.forEach(correctWord => {
    if (userWords.some(userWord => 
      userWord.includes(correctWord) || correctWord.includes(userWord)
    )) {
      matches++;
    }
  });
  
  const score = matches / correctWords.length;
  const isCorrect = score >= 0.7; // Requerir 70% de coincidencia
  
  let feedback = '';
  if (score >= 0.9) {
    feedback = '¡Perfecto! Has completado correctamente todos los espacios.';
  } else if (score >= 0.7) {
    feedback = '¡Bien! La mayoría de tus respuestas son correctas.';
  } else if (score >= 0.4) {
    feedback = 'Algunas respuestas son correctas, pero revisa los conceptos faltantes.';
  } else {
    feedback = 'Necesitas repasar el material para completar correctamente los espacios.';
  }
  
  return {
    questionId: question.id,
    userAnswer: userAnswer.answer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    score,
    feedback,
    explanation: question.explanation + ` Coincidencias encontradas: ${matches}/${correctWords.length}`
  };
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter((word, index, arr) => arr.indexOf(word) === index) // Únicos
    .slice(0, 10); // Máximo 10 keywords
}

function generateRecommendations(evaluations: EvaluationResult[]): string[] {
  const recommendations: string[] = [];
  const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length;
  
  if (totalScore < 0.5) {
    recommendations.push('Considera repasar el material antes de intentar otro examen.');
    recommendations.push('Enfócate en comprender los conceptos fundamentales del tema.');
  } else if (totalScore < 0.7) {
    recommendations.push('¡Buen trabajo! Continúa practicando para mejorar tu puntuación.');
    recommendations.push('Revisa las preguntas que respondiste incorrectamente.');
  } else if (totalScore < 0.9) {
    recommendations.push('¡Excelente rendimiento! Estás dominando el material.');
    recommendations.push('Considera intentar un examen de mayor dificultad.');
  } else {
    recommendations.push('¡Perfecto! Has demostrado un dominio completo del tema.');
    recommendations.push('Estás listo para abordar material más avanzado.');
  }
  
  // Recomendaciones específicas por tipo de pregunta
  const openEndedErrors = evaluations.filter(evaluation => 
    evaluation.questionId.includes('oe') && !evaluation.isCorrect
  ).length;
  
  if (openEndedErrors > 0) {
    recommendations.push('Practica desarrollar respuestas más detalladas en preguntas abiertas.');
  }
  
  const multipleChoiceErrors = evaluations.filter(evaluation => 
    evaluation.questionId.includes('mc') && !evaluation.isCorrect
  ).length;
  
  if (multipleChoiceErrors > evaluations.length * 0.3) {
    recommendations.push('Lee cuidadosamente todas las opciones antes de seleccionar tu respuesta.');
  }
  
  return recommendations;
}