import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Contenido requerido' },
        { status: 400 }
      );
    }

    // Simular análisis de contenido con IA
    // En una implementación real, aquí se usaría OpenAI o similar
    await new Promise(resolve => setTimeout(resolve, 1000));

    const analysis = {
      keyTopics: extractKeyTopics(content),
      complexity: analyzeComplexity(content),
      readabilityScore: calculateReadability(content),
      estimatedStudyTime: estimateStudyTime(content),
      suggestedQuestionTypes: suggestQuestionTypes(content),
      conceptMap: buildConceptMap(content)
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Error procesando el contenido' },
      { status: 500 }
    );
  }
}

function extractKeyTopics(content: string): string[] {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function analyzeComplexity(content: string): 'basic' | 'intermediate' | 'advanced' {
  const words = content.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const sentences = content.split(/[.!?]+/).length;
  const avgSentenceLength = words.length / sentences;

  if (avgWordLength > 6 && avgSentenceLength > 20) return 'advanced';
  if (avgWordLength > 5 && avgSentenceLength > 15) return 'intermediate';
  return 'basic';
}

function calculateReadability(content: string): number {
  // Fórmula simplificada de legibilidad
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const syllables = estimateSyllables(content);

  const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  return Math.max(0, Math.min(100, Math.round(fleschScore)));
}

function estimateSyllables(content: string): number {
  const words = content.toLowerCase().match(/[a-z]+/g) || [];
  return words.reduce((total, word) => {
    const vowels = (word.match(/[aeiou]/g) || []).length;
    const silent_e = word.endsWith('e') ? 1 : 0;
    return total + Math.max(1, vowels - silent_e);
  }, 0);
}

function estimateStudyTime(content: string): number {
  const words = content.split(/\s+/).length;
  const readingTime = Math.ceil(words / 200); // 200 palabras por minuto
  const studyTime = readingTime * 3; // Factor 3x para estudio activo
  return studyTime;
}

function suggestQuestionTypes(content: string): string[] {
  const types = [];
  
  // Siempre incluir básicos
  types.push('multiple-choice', 'true-false');
  
  // Basado en longitud y complejidad
  if (content.length > 1000) {
    types.push('open-ended');
  }
  
  if (content.includes('definición') || content.includes('concepto')) {
    types.push('fill-blanks');
  }
  
  return types;
}

function buildConceptMap(content: string): Array<{concept: string, related: string[]}> {
  const keyTopics = extractKeyTopics(content);
  
  return keyTopics.slice(0, 5).map(topic => ({
    concept: topic,
    related: keyTopics.filter(t => t !== topic).slice(0, 3)
  }));
}