export type QuizAnswer = { question_id: string; selected_answer: number };
export interface QuizResult { score: number; correct: number; total: number; passed: boolean }

export function latestQuizAnswers(questionIds: string[], answers: QuizAnswer[]): QuizAnswer[] {
  const latest = new Map(answers.map(answer => [answer.question_id, answer.selected_answer]));
  return questionIds.map(question_id => {
    const selected_answer = latest.get(question_id);
    if (selected_answer === undefined) throw new Error("Every quiz question needs an answer");
    return { question_id, selected_answer };
  });
}