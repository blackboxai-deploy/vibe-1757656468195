import { NextRequest, NextResponse } from 'next/server';

interface ExamConfig {
  materialId: string;
  content: string;
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    openEnded: boolean;
    fillInBlanks: boolean;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  title: string;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended' | 'fill-blanks';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

export async function POST(request: NextRequest) {
  try {
    const config: ExamConfig = await request.json();

    if (!config.content || !config.materialId) {
      return NextResponse.json(
        { error: 'Contenido y materialId requeridos' },
        { status: 400 }
      );
    }

    // Simular generación de preguntas con IA
    // En una implementación real, aquí se usaría OpenAI GPT-4
    const questions = await generateQuestions(config);

    const exam = {
      id: generateExamId(),
      materialId: config.materialId,
      title: config.title,
      questions,
      config: {
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        timeLimit: calculateTimeLimit(config.questionCount)
      },
      createdDate: new Date().toISOString(),
      status: 'ready'
    };

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error generating exam:', error);
    return NextResponse.json(
      { error: 'Error generando el examen' },
      { status: 500 }
    );
  }
}

async function generateQuestions(config: ExamConfig): Promise<Question[]> {
  const questions: Question[] = [];
  const contentParts = splitContent(config.content);
  const enabledTypes = getEnabledQuestionTypes(config.questionTypes);
  
  for (let i = 0; i < config.questionCount; i++) {
    // Simular delay de procesamiento IA
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const typeIndex = i % enabledTypes.length;
    const questionType = enabledTypes[typeIndex];
    const contentPart = contentParts[i % contentParts.length];
    
    const question = await generateSingleQuestion(
      questionType,
      contentPart,
      config.difficulty,
      i + 1
    );
    
    questions.push(question);
  }
  
  return questions;
}

function getEnabledQuestionTypes(questionTypes: ExamConfig['questionTypes']): string[] {
  const types: string[] = [];
  
  if (questionTypes.multipleChoice) types.push('multiple-choice');
  if (questionTypes.trueFalse) types.push('true-false');
  if (questionTypes.openEnded) types.push('open-ended');
  if (questionTypes.fillInBlanks) types.push('fill-blanks');
  
  return types;
}

async function generateSingleQuestion(
  type: string,
  content: string,
  difficulty: string,
  questionNumber: number
): Promise<Question> {
  const id = `q_${questionNumber}_${type.replace('-', '')}`;
  
  switch (type) {
    case 'multiple-choice':
      return generateMultipleChoiceQuestion(id, content, difficulty, questionNumber);
      
    case 'true-false':
      return generateTrueFalseQuestion(id, content, difficulty, questionNumber);
      
    case 'open-ended':
      return generateOpenEndedQuestion(id, content, difficulty, questionNumber);
      
    case 'fill-blanks':
      return generateFillBlanksQuestion(id, content, difficulty, questionNumber);
      
    default:
      throw new Error(`Tipo de pregunta no soportado: ${type}`);
  }
}

function generateMultipleChoiceQuestion(
  id: string,
  content: string,
  difficulty: string,
  questionNumber: number
): Question {
  const keywords = extractKeywords(content);
  const selectedKeyword = keywords[questionNumber % keywords.length] || 'concepto';
  
  // const difficultyPrompts = {
  //   easy: 'básico',
  //   medium: 'intermedio',
  //   hard: 'avanzado'
  // };
  
  const question = `Pregunta ${questionNumber}: ¿Cuál de las siguientes afirmaciones sobre "${selectedKeyword}" es correcta según el material de estudio?`;
  
  const correctAnswer = `El concepto de ${selectedKeyword} es fundamental en este contexto y se define como un elemento clave del material de estudio.`;
  const incorrectOptions = [
    `${selectedKeyword} es un término secundario que no tiene relevancia en este material.`,
    `La definición de ${selectedKeyword} es contradictoria con los principios básicos del tema.`,
    `${selectedKeyword} solo se aplica en contextos muy específicos y limitados.`
  ];
  
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5);
  
  return {
    id,
    type: 'multiple-choice',
    question,
    options,
    correctAnswer,
    explanation: `Esta respuesta es correcta porque ${selectedKeyword} efectivamente representa un concepto fundamental en el material de estudio, como se puede observar en el contenido analizado.`,
    difficulty
  };
}

function generateTrueFalseQuestion(
  id: string,
  content: string,
  difficulty: string,
  questionNumber: number
): Question {
  const keywords = extractKeywords(content);
  const selectedKeyword = keywords[questionNumber % keywords.length] || 'concepto';
  
  const isTrue = Math.random() > 0.5;
  const question = isTrue
    ? `Pregunta ${questionNumber}: El término "${selectedKeyword}" aparece y es relevante en el material de estudio presentado.`
    : `Pregunta ${questionNumber}: El concepto "${selectedKeyword}" no tiene ninguna relación con el contenido del material de estudio.`;
  
  const correctAnswer = isTrue ? 'Verdadero' : 'Falso';
  const explanation = isTrue
    ? `Verdadero. El término "${selectedKeyword}" efectivamente aparece en el material y es relevante para la comprensión del tema.`
    : `Falso. El concepto "${selectedKeyword}" sí tiene relación con el material de estudio y es importante para su comprensión.`;
  
  return {
    id,
    type: 'true-false',
    question,
    options: ['Verdadero', 'Falso'],
    correctAnswer,
    explanation,
    difficulty
  };
}

function generateOpenEndedQuestion(
  id: string,
  content: string,
  difficulty: string,
  questionNumber: number
): Question {
  const keywords = extractKeywords(content);
  const selectedKeyword = keywords[questionNumber % keywords.length] || 'tema principal';
  
  const difficultyPrompts = {
    easy: 'explica brevemente',
    medium: 'analiza y describe',
    hard: 'evalúa críticamente y argumenta'
  };
  
  const prompt = difficultyPrompts[difficulty as keyof typeof difficultyPrompts];
  const question = `Pregunta ${questionNumber}: ${prompt} el concepto de "${selectedKeyword}" basándote en el material de estudio. Incluye ejemplos específicos del contenido.`;
  
  const correctAnswer = `Una respuesta completa debería incluir: 1) Definición clara del concepto "${selectedKeyword}", 2) Su importancia en el contexto del material, 3) Ejemplos específicos del contenido estudiado, 4) Relación con otros conceptos del material.`;
  
  return {
    id,
    type: 'open-ended',
    question,
    correctAnswer,
    explanation: `Para evaluar esta respuesta, se debe verificar que incluya los elementos mencionados en la respuesta modelo y que demuestre comprensión profunda del concepto "${selectedKeyword}".`,
    difficulty
  };
}

function generateFillBlanksQuestion(
  id: string,
  content: string,
  difficulty: string,
  questionNumber: number
): Question {
  const keywords = extractKeywords(content);
  const selectedKeyword = keywords[questionNumber % keywords.length] || 'concepto';
  const relatedKeyword = keywords[(questionNumber + 1) % keywords.length] || 'elemento';
  
  const question = `Pregunta ${questionNumber}: Completa la siguiente oración basándote en el material de estudio: "El _______ de ${selectedKeyword} se relaciona directamente con _______ en el contexto del tema estudiado."`;
  
  const correctAnswer = `concepto, ${relatedKeyword}`;
  const explanation = `Las palabras correctas son "concepto" y "${relatedKeyword}" porque establecen una relación coherente con el contenido del material de estudio.`;
  
  return {
    id,
    type: 'fill-blanks',
    question,
    correctAnswer,
    explanation,
    difficulty
  };
}

function extractKeywords(content: string): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4);
  
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

function splitContent(content: string): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  
  for (let i = 0; i < sentences.length; i += 2) {
    const chunk = sentences.slice(i, i + 2).join('. ');
    if (chunk.trim()) chunks.push(chunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

function calculateTimeLimit(questionCount: number): number {
  // Aproximadamente 2-3 minutos por pregunta
  return Math.max(10, questionCount * 2.5);
}

function generateExamId(): string {
  return 'exam_' + Math.random().toString(36).substr(2, 9);
}