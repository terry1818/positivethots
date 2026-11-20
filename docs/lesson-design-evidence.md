# Lesson design: what the research supports

Rules for the rich lesson player (`src/components/education/LessonRich.tsx`,
`src/lib/lessonEnhancements.ts`). Each rule traces to a published finding. A lesson's
text is never rewritten to fit them: extras are added around it.

| Rule in the app | Finding | Size of effect |
|---|---|---|
| One idea per card, learner taps to move on | Segmenting principle (Mayer) | median d = 0.77, 10 of 10 tests |
| Nothing on a card that is not about its idea; no background music | Coherence principle (Mayer); seductive details (Sundararajan & Adesope 2020) | d = 0.86, 23 of 23 tests; g = -0.33 when irrelevant extras are added |
| The first sentence is larger, key terms are highlighted | Signalling principle (Mayer) | above the d = 0.40 bar Mayer uses |
| Every picture shows the idea on its card | Multimedia principle; decorative pictures do not help | see Mayer; Frontiers in Psychology 2024 |
| Warm colour and characters with faces | Emotional design (Brom et al. 2018; Wong & Adesope 2021) | retention about g = 0.35, comprehension about 0.3 |
| Recall questions inside the lesson, with the answer explained | Testing effect (Rowland 2014; Adesope et al. 2017) | g = 0.50, and 0.69 when tested more than a day later |
| Multiple choice is acceptable for those questions | Adesope et al. 2017 | at least as effective as free recall |

## What this means when adding a lesson

1. Each heading in the lesson text becomes one card with one picture.
2. The picture must show the idea. If no picture can, use none.
3. Sound plays only in response to something the learner did.
4. Add one recall question per two or three ideas. It awards no XP, so it can be checked on the device.
5. Colour meanings stay fixed: lime correct, sky progress, gold reward, coral streak, teal highlight.
6. Everything animated has a still version under `prefers-reduced-motion`.

## Sources

- Mayer, R. E. Research-based principles for designing multimedia instruction. https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-research-based-principles-for-designing-multimedia-instruction-mayer.pdf
- Mayer, R. E. How multimedia can improve learning and instruction. https://my.chartered.college/?p=6958
- Brom, C. et al. (2018). How effective is emotional design? Educational Research Review. https://artemis.ms.mff.cuni.cz/main/papers/emodesign_manuscript_1rev_180928_FINAL_norev.pdf
- Wong, R. M. & Adesope, O. O. Meta-analysis of emotional designs in multimedia learning. https://ifp.nyu.edu/?p=1490708
- Sundararajan, N. & Adesope, O. (2020). Seductive details meta-analysis. https://news.wsu.edu/2020/03/19/seductive-details-inhibit-learning/
- Adesope, O. O., Trevisan, D. A. & Sundararajan, N. (2017). Rethinking the use of tests. https://education.wsu.edu/documents/2018/01/rethinking-use-tests.pdf/
- Rowland (2014), as summarised in https://link.springer.com/10.1186/s41235-023-00508-8
