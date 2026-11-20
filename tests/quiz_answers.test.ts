import { test, expect } from "bun:test";
import { latestQuizAnswers } from "../src/lib/quizAnswers";

test("submit each non-checkpoint question's real final selected answer", () => {
  expect(latestQuizAnswers(["q1", "q2"], [
    { question_id: "q1", selected_answer: 0 },
    { question_id: "checkpoint", selected_answer: 1 },
    { question_id: "q2", selected_answer: 3 },
    { question_id: "q1", selected_answer: 2 },
  ])).toEqual([{ question_id: "q1", selected_answer: 2 }, { question_id: "q2", selected_answer: 3 }]);
});

test("an incomplete answer set cannot be submitted as a pass", () => {
  expect(() => latestQuizAnswers(["q1", "q2"], [{ question_id: "q1", selected_answer: 0 }])).toThrow();
});