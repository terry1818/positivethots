import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

function generateRandomPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const testUsers = [
  { email: "alex.test@positivethots.app", name: "Alex Rivera", age: 28, pronouns: "they/them", gender: "Non-binary", gender_preference: "All genders", relationship_style: "Polyamorous", relationship_status: "In a relationship", looking_for: "New connections", interests: ["Art","Writing","Hiking","Board Games","Coffee"], experience_level: "experienced", bio: "Queer artist and writer exploring ethical non-monogamy. Love hiking, board games, and deep conversations over coffee.", location: "Portland", boundaries: "Clear communication before meetups", imagePrompt: "Portrait photo of a 28-year-old non-binary person with an artistic vibe, short colorful hair, warm smile, wearing casual creative clothing, natural lighting, upper body shot" },
  { email: "jordan.test@positivethots.app", name: "Jordan Lee", age: 32, pronouns: "he/him", gender: "Man", gender_preference: "Women", relationship_style: "Open relationship", relationship_status: "In a relationship", looking_for: "Casual connecting", interests: ["Dancing","Technology","Cooking","Travel","Fitness"], experience_level: "experienced", bio: "Software engineer by day, salsa dancer by night. Looking for genuine connections built on trust and openness.", location: "Austin", boundaries: "Respectful communication always", imagePrompt: "Portrait photo of a 32-year-old attractive man with a confident smile, athletic build, well-groomed, wearing a casual button-up shirt, warm lighting, upper body shot" },
  { email: "sam.test@positivethots.app", name: "Sam Chen", age: 25, pronouns: "she/her", gender: "Woman", gender_preference: "All genders", relationship_style: "Exploring", relationship_status: "Single", looking_for: "Friends first", interests: ["Yoga","Meditation","Nature","Reading","Cooking"], experience_level: "new", bio: "Yoga instructor passionate about mindfulness and body positivity. New to ENM and excited to learn.", location: "Denver", boundaries: "Take things slow", imagePrompt: "Portrait photo of a 25-year-old woman with a serene and friendly expression, athletic yoga-instructor body type, long dark hair, natural minimal makeup, warm lighting, upper body shot" },
  { email: "morgan.test@positivethots.app", name: "Morgan Taylor", age: 30, pronouns: "he/they", gender: "Non-binary", gender_preference: "All genders", relationship_style: "Relationship anarchy", relationship_status: "Dating", looking_for: "Long-term partners", interests: ["Music","Philosophy","Mixology","Film","Poetry"], experience_level: "veteran", bio: "Musician and bartender who believes love isn't a finite resource. Let's grab a drink and talk philosophy.", location: "Chicago", boundaries: "Honesty and transparency", imagePrompt: "Portrait photo of a 30-year-old androgynous person with an edgy musician vibe, tattoos visible, dark wavy hair, charming smirk, moody bar lighting, upper body shot" },
  { email: "riley.test@positivethots.app", name: "Riley Brooks", age: 24, pronouns: "she/they", gender: "Woman", gender_preference: "Men and non-binary", relationship_style: "Curious", relationship_status: "Single", looking_for: "New connections", interests: ["Psychology","Reading","Hiking","Photography","Music"], experience_level: "curious", bio: "Grad student studying psychology. Curious about alternative relationship structures and always learning.", location: "Seattle", boundaries: "Meet in public first", imagePrompt: "Portrait photo of a 24-year-old woman with an intellectual bookish look, glasses, natural wavy hair, wearing a cozy sweater, soft smile, natural daylight, upper body shot" },
  { email: "dakota.test@positivethots.app", name: "Dakota James", age: 35, pronouns: "he/him", gender: "Man", gender_preference: "Women and non-binary", relationship_style: "Polyamorous", relationship_status: "In a relationship", looking_for: "Casual connecting", interests: ["Cooking","Travel","Photography","Wine","Surfing"], experience_level: "veteran", bio: "Chef and traveler with a passion for exploring cultures and connections. Practiced ENM for 8 years.", location: "San Francisco", boundaries: "STI testing every 3 months", imagePrompt: "Portrait photo of a 35-year-old rugged handsome man with a chef-traveler vibe, light beard, tanned skin, confident warm expression, outdoor golden hour lighting, upper body shot" },
  { email: "avery.test@positivethots.app", name: "Avery Quinn", age: 27, pronouns: "she/her", gender: "Woman", gender_preference: "Women", relationship_style: "Open relationship", relationship_status: "Dating", looking_for: "Long-term partners", interests: ["Reading","Cats","Board Games","Gardening","Art"], experience_level: "experienced", bio: "Librarian and cat mom. Introverted but passionate about meaningful connections and cozy nights in.", location: "Portland", boundaries: "Respect my alone time", imagePrompt: "Portrait photo of a 27-year-old woman with a cozy librarian aesthetic, soft red hair, gentle smile, wearing a cardigan, warm indoor lighting, upper body shot" },
  { email: "casey.test@positivethots.app", name: "Casey Nguyen", age: 29, pronouns: "they/them", gender: "Non-binary", gender_preference: "All genders", relationship_style: "Polyamorous", relationship_status: "In a relationship", looking_for: "New connections", interests: ["Fitness","Plants","Cooking","Yoga","Hiking"], experience_level: "experienced", bio: "Fitness coach and plant parent. Big believer in communication and consent as the foundation of everything.", location: "Austin", boundaries: "Regular check-ins are a must", imagePrompt: "Portrait photo of a 29-year-old fit non-binary person with a warm approachable look, short stylish hair, athletic build, wearing a tank top, bright natural lighting, upper body shot" },
];

async function generateProfileImage(prompt: string, userId: string, supabaseAdmin: any): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `Generate a realistic profile photo for a relationship wellness community app. ${prompt}. The photo should look like a real photograph, not AI-generated. No text or watermarks.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl || !imageUrl.startsWith("data:image")) {
      console.error("No image in response");
      return null;
    }

    // Extract base64 data
    const base64Data = imageUrl.split(",")[1];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage
    const filePath = `${userId}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-images")
      .upload(filePath, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Admin authentication guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await supabaseAdmin
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

    const results: string[] = [];

    // First pass: create all auth users and profiles with fallback avatars
    const userIds: { user: typeof testUsers[0]; userId: string }[] = [];

    for (const user of testUsers) {
      const randomPassword = generateRandomPassword();
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: randomPassword,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message?.includes("already been registered")) {
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find((u: any) => u.email === user.email);
          if (existingUser) {
            userIds.push({ user, userId: existingUser.id });
            results.push(`${user.name}: exists, will regenerate image`);
          }
          continue;
        }
        results.push(`${user.name}: auth error - ${authError.message}`);
        continue;
      }

      // Create profile with fallback avatar first
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: authData.user.id,
        name: user.name,
        age: user.age,
        bio: user.bio,
        location: user.location,
        profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`,
        pronouns: user.pronouns,
        gender: user.gender,
        gender_preference: user.gender_preference,
        relationship_style: user.relationship_style,
        relationship_status: user.relationship_status,
        looking_for: user.looking_for,
        interests: user.interests,
        experience_level: user.experience_level,
        boundaries: user.boundaries,
        onboarding_completed: true,
      });

      if (profileError) {
        results.push(`${user.name}: profile error - ${profileError.message}`);
      } else {
        userIds.push({ user, userId: authData.user.id });
        results.push(`${user.name}: profile created`);
      }
    }

    // Second pass: generate AI images in parallel (batches of 4)
    for (let i = 0; i < userIds.length; i += 4) {
      const batch = userIds.slice(i, i + 4);
      const imageResults = await Promise.allSettled(
        batch.map(async ({ user, userId }) => {
          const imageUrl = await generateProfileImage(user.imagePrompt, userId, supabaseAdmin);
          if (imageUrl) {
            await supabaseAdmin.from("profiles").update({ profile_image: imageUrl }).eq("id", userId);
            return `${user.name}: AI photo updated`;
          }
          return `${user.name}: image generation failed`;
        })
      );
      imageResults.forEach((r) => {
        results.push(r.status === "fulfilled" ? r.value : `image error: ${r.reason}`);
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
