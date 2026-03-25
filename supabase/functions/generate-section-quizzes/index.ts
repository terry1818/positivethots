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

    const { moduleSlug, sectionId } = await req.json();

    // If sectionId provided, generate for one section; otherwise generate for all sections of a module
    let sections: any[] = [];

    if (sectionId) {
      const { data, error } = await supabase
        .from("module_sections")
        .select("id, title, content_text, module_id, section_number, education_modules(title, slug)")
        .eq("id", sectionId)
        .single();
      if (error) throw error;
      sections = [data];
    } else if (moduleSlug) {
      const { data: mod } = await supabase
        .from("education_modules")
        .select("id")
        .eq("slug", moduleSlug)
        .single();
      if (!mod) throw new Error("Module not found");

      const { data, error } = await supabase
        .from("module_sections")
        .select("id, title, content_text, module_id, section_number, education_modules(title, slug)")
        .eq("module_id", mod.id)
        .order("section_number");
      if (error) throw error;
      sections = data || [];
    } else {
      // Generate for ALL sections
      const { data, error } = await supabase
        .from("module_sections")
        .select("id, title, content_text, module_id, section_number, education_modules(title, slug)")
        .order("section_number");
      if (error) throw error;
      sections = data || [];
    }

    const results: { sectionId: string; sectionTitle: string; questionsGenerated: number }[] = [];

    for (const section of sections) {
      // Check if section already has 4 questions (target: 4 per section × 5 sections = 20 per module)
      const { count } = await supabase
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .eq("section_id", section.id);

      if ((count || 0) >= 4) {
        results.push({
          sectionId: section.id,
          sectionTitle: section.title,
          questionsGenerated: 0,
        });
        continue;
      }

      // Delete any existing section questions to regenerate cleanly
      if ((count || 0) > 0) {
        await supabase
          .from("quiz_questions")
          .delete()
          .eq("section_id", section.id);
      }

      const moduleTitle = (section.education_modules as any)?.title || "Unknown Module";
      const sectionContent = section.content_text || section.title;

      // Use AI to generate questions
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
- Cover different aspects of the section content
- Range from basic recall to applied understanding

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
        continue;
      }

      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      
      // Strip markdown code fences if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let questions: any[];
      try {
        questions = JSON.parse(content);
      } catch (e) {
        console.error(`Failed to parse AI response for section ${section.title}:`, content.substring(0, 200));
        continue;
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        console.error(`Invalid questions array for section ${section.title}`);
        continue;
      }

      // Insert questions
      const inserts = questions.slice(0, 4).map((q: any, idx: number) => ({
        module_id: section.module_id,
        section_id: section.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        order_index: idx,
      }));

      const { error: insertError } = await supabase
        .from("quiz_questions")
        .insert(inserts);

      if (insertError) {
        console.error(`Insert error for section ${section.title}:`, insertError);
        continue;
      }

      results.push({
        sectionId: section.id,
        sectionTitle: section.title,
        questionsGenerated: inserts.length,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sectionsProcessed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[generate-section-quizzes] error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
