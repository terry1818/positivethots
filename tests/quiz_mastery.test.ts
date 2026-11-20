import { expect, test } from "bun:test";
import { choosePraise, createMastery, firstTryScore, recordMastery, restoreRemaining, shuffledOptionIndexes } from "../src/lib/quizMastery";
test("miss returns later and mastery progress never decreases during answering", () => {
 let s=createMastery(["a","b","c"]);s=recordMastery(s,false);expect(s.queue).toEqual(["b","c","a"]);expect(s.mastered.length).toBe(0);
 s=recordMastery(s,true);s=recordMastery(s,true);s=recordMastery(s,true);expect(s.queue).toEqual([]);expect(s.mastered.length).toBe(3);expect(firstTryScore(s,3)).toEqual({score:67,correct:2});
});
test("three misses retain the question for lesson rereading and do not inflate mastered counts",()=>{
 let s=createMastery(["a"]);for(let i=0;i<3;i++)s=recordMastery(s,false);expect(s.misses.a).toBe(3);expect(s.queue).toEqual(["a"]);expect(s.mastered).toEqual([]);
});
test("combo hits 3, 5, 10 and silently resets on a miss",()=>{
 let s=createMastery(Array.from({length:11},(_,i)=>String(i)));for(let i=1;i<=10;i++){s=recordMastery(s,true);expect(s.combo).toBe(i);}s=recordMastery(s,false);expect(s.combo).toBe(0);
});
test("revisited options change order and keep original grading indexes",()=>{
 const previous=[0,1,2,3];const shuffled=shuffledOptionIndexes(4,previous,()=>0.999);expect(shuffled).not.toEqual(previous);expect([...shuffled].sort()).toEqual(previous);const texts=["A","B","C","D"];expect(texts[shuffled[0]]).toBe("B");expect(shuffled[0]).toBe(1);
});
test("server remaining questions reopen the queue while keeping first-try history",()=>{
 let s=createMastery(["a","b"]);s=recordMastery(s,true);s=recordMastery(s,true);s=restoreRemaining(s,["a"]);expect(s.queue).toEqual(["a"]);expect(s.mastered.length).toBe(2);expect(firstTryScore(s,2).score).toBe(100);
});
test("praise never repeats consecutively",()=>{expect(choosePraise(["Nice one!","Spot on!"],"Nice one!",()=>0)).toBe("Spot on!");});
test("tier review keeps its one-pass flow without requeuing",()=>{expect(recordMastery(createMastery(["a"]),false,false).queue).toEqual([]);});
