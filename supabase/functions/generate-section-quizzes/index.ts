import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth + admin guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", claimsData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { moduleSlug, sectionId, moduleId } = body;

    // ─── NEW: Course-level generation (7 questions) ───
    if (moduleId || (moduleSlug && !sectionId)) {
      const result = await generateCourseQuiz(supabase, lovableApiKey, corsHeaders, moduleId, moduleSlug);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.error ? 500 : 200,
      });
    }

    // ─── LEGACY: Per-section generation ───
    if (sectionId) {
      const result = await generateSectionQuiz(supabase, lovableApiKey, sectionId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.error ? 500 : 200,
      });
    }

    return new Response(
      JSON.stringify({ error: "Provide moduleId, moduleSlug, or sectionId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[generate-section-quizzes] error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});

// ─── Course-level: generate exactly 7 questions spanning all sections ───
async function generateCourseQuiz(
  supabase: any,
  lovableApiKey: string,
  corsHeaders: Record<string, string>,
  moduleId?: string,
  moduleSlug?: string,
) {
  // Resolve module
  let modId = moduleId;
  let modTitle = "";
  if (!modId && moduleSlug) {
    const { data: mod } = await supabase
      .from("education_modules")
      .select("id, title")
      .eq("slug", moduleSlug)
      .single();
    if (!mod) return { error: "Module not found" };
    modId = mod.id;
    modTitle = mod.title;
  } else if (modId) {
    const { data: mod } = await supabase
      .from("education_modules")
      .select("title")
      .eq("id", modId)
      .single();
    modTitle = mod?.title || "Unknown Module";
  }

  // Fetch all sections
  const { data: sections, error: secError } = await supabase
    .from("module_sections")
    .select("id, title, content_text, section_number")
    .eq("module_id", modId)
    .order("section_number");

  if (secError) return { error: secError.message };

  // Build combined context
  const sectionContext = (sections || [])
    .map((s: any) => `## Section ${s.section_number}: ${s.title}\n${(s.content_text || "").substring(0, 3000)}`)
    .join("\n\n");

  const prompt = `You are an expert educator creating quiz questions for an adult education platform about relationships, consent, and sexual health.

Course: "${modTitle}"

Course Content:
${sectionContext.substring(0, 12000)}

Generate exactly 7 multiple-choice quiz questions for this education course.

Requirements:
- Each question must have exactly 4 answer options
- Exactly 1 correct answer per question
- Questions should cover all sections of the course content provided
- Mix difficulty: 2 easy (direct recall), 3 medium (application), 2 hard (scenario/analysis)
- Each question must be a complete, standalone question
- Question text should be clear, concise, and unambiguous
- Wrong answers should be plausible but clearly incorrect to someone who studied the material
- Focus on key concepts, practical application, and critical thinking — not trivia
- Be appropriate for adults learning about relationships and sexual health

Return ONLY valid JSON in this exact format (no markdown, no explanation):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0
  }
]

The correct_answer is the 0-based index of the correct option. Return exactly 7 items.`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI error:", errText);
    return { error: "AI generation failed" };
  }

  const aiData = await aiResponse.json();
  let content = aiData.choices?.[0]?.message?.content || "";
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let questions: any[];
  try {
    questions = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse AI response:", content.substring(0, 200));
    return { error: "Failed to parse AI response" };
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: "Invalid questions array from AI" };
  }

  // Delete existing questions for this module
  await supabase.from("quiz_questions").delete().eq("module_id", modId);

  // Insert exactly 7
  const inserts = questions.slice(0, 7).map((q: any, idx: number) => ({
    module_id: modId,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    order_index: idx,
  }));

  const { error: insertError } = await supabase.from("quiz_questions").insert(inserts);
  if (insertError) {
    console.error("Insert error:", insertError);
    return { error: insertError.message };
  }

  return {
    success: true,
    moduleId: modId,
    questionsGenerated: inserts.length,
  };
}

// ─── Legacy: per-section generation (kept for backward compat) ───
async function generateSectionQuiz(
  supabase: any,
  lovableApiKey: string,
  sectionId: string,
) {
  const { data: section, error } = await supabase
    .from("module_sections")
    .select("id, title, content_text, module_id, section_number, education_modules(title)")
    .eq("id", sectionId)
    .single();

  if (error) return { error: error.message };

  const moduleTitle = (section.education_modules as any)?.title || "Unknown Module";
  const sectionContent = section.content_text || section.title;

  const prompt = `You are an expert educator creating quiz questions for an adult education platform about relationships, consent, and sexual health.

Module: "${moduleTitle}"
Section: "${section.title}" (Section ${section.section_number})

Section Content:
${sectionContent.substring(0, 4000)}

Generate exactly 4 multiple-choice quiz questions about this section's specific topics. Each question must:
- Have exactly 4 answer options
- Have exactly 1 correct answer
- Test understanding, not just memorization
- Be appropriate for adults learning about relationships and sexual health

Return ONLY valid JSON in this exact format (no markdown, no explanation):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0
  }
]

The correct_answer is the 0-based index of the correct option.`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!aiResponse.ok) {
    console.error(`AI error for section ${section.title}:`, await aiResponse.text());
    return { error: "AI generation failed" };
  }

  const aiData = await aiResponse.json();
  let content = aiData.choices?.[0]?.message?.content || "";
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let questions: any[];
  try {
    questions = JSON.parse(content);
  } catch (e) {
    console.error(`Failed to parse AI response for section ${section.title}:`, content.substring(0, 200));
    return { error: "Failed to parse AI response" };
  }

  // Delete existing section questions then insert
  await supabase.from("quiz_questions").delete().eq("section_id", section.id);

  const inserts = questions.slice(0, 4).map((q: any, idx: number) => ({
    module_id: section.module_id,
    section_id: section.id,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    order_index: idx,
  }));

  const { error: insertError } = await supabase.from("quiz_questions").insert(inserts);
  if (insertError) return { error: insertError.message };

  return {
    success: true,
    sectionId: section.id,
    sectionTitle: section.title,
    questionsGenerated: inserts.length,
  };
}
