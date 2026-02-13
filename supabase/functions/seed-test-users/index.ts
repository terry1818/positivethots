import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const testUsers = [
  { email: "alex.test@positivethots.app", password: "TestPass123!", name: "Alex Rivera", age: 28, pronouns: "they/them", gender: "Non-binary", gender_preference: "All genders", relationship_style: "Polyamorous", relationship_status: "In a relationship", looking_for: "New connections", interests: ["Art","Writing","Hiking","Board Games","Coffee"], experience_level: "experienced", bio: "Queer artist and writer exploring ethical non-monogamy. Love hiking, board games, and deep conversations over coffee.", location: "Portland", boundaries: "Clear communication before meetups" },
  { email: "jordan.test@positivethots.app", password: "TestPass123!", name: "Jordan Lee", age: 32, pronouns: "he/him", gender: "Man", gender_preference: "Women", relationship_style: "Open relationship", relationship_status: "In a relationship", looking_for: "Casual dating", interests: ["Dancing","Technology","Cooking","Travel","Fitness"], experience_level: "experienced", bio: "Software engineer by day, salsa dancer by night. Looking for genuine connections built on trust and openness.", location: "Austin", boundaries: "Respectful communication always" },
  { email: "sam.test@positivethots.app", password: "TestPass123!", name: "Sam Chen", age: 25, pronouns: "she/her", gender: "Woman", gender_preference: "All genders", relationship_style: "Exploring", relationship_status: "Single", looking_for: "Friends first", interests: ["Yoga","Meditation","Nature","Reading","Cooking"], experience_level: "new", bio: "Yoga instructor passionate about mindfulness and body positivity. New to ENM and excited to learn.", location: "Denver", boundaries: "Take things slow" },
  { email: "morgan.test@positivethots.app", password: "TestPass123!", name: "Morgan Taylor", age: 30, pronouns: "he/they", gender: "Non-binary", gender_preference: "All genders", relationship_style: "Relationship anarchy", relationship_status: "Dating", looking_for: "Long-term partners", interests: ["Music","Philosophy","Mixology","Film","Poetry"], experience_level: "veteran", bio: "Musician and bartender who believes love isn't a finite resource. Let's grab a drink and talk philosophy.", location: "Chicago", boundaries: "Honesty and transparency" },
  { email: "riley.test@positivethots.app", password: "TestPass123!", name: "Riley Brooks", age: 24, pronouns: "she/they", gender: "Woman", gender_preference: "Men and non-binary", relationship_style: "Curious", relationship_status: "Single", looking_for: "New connections", interests: ["Psychology","Reading","Hiking","Photography","Music"], experience_level: "curious", bio: "Grad student studying psychology. Curious about alternative relationship structures and always learning.", location: "Seattle", boundaries: "Meet in public first" },
  { email: "dakota.test@positivethots.app", password: "TestPass123!", name: "Dakota James", age: 35, pronouns: "he/him", gender: "Man", gender_preference: "Women and non-binary", relationship_style: "Polyamorous", relationship_status: "In a relationship", looking_for: "Casual dating", interests: ["Cooking","Travel","Photography","Wine","Surfing"], experience_level: "veteran", bio: "Chef and traveler with a passion for exploring cultures and connections. Practiced ENM for 8 years.", location: "San Francisco", boundaries: "STI testing every 3 months" },
  { email: "avery.test@positivethots.app", password: "TestPass123!", name: "Avery Quinn", age: 27, pronouns: "she/her", gender: "Woman", gender_preference: "Women", relationship_style: "Open relationship", relationship_status: "Dating", looking_for: "Long-term partners", interests: ["Reading","Cats","Board Games","Gardening","Art"], experience_level: "experienced", bio: "Librarian and cat mom. Introverted but passionate about meaningful connections and cozy nights in.", location: "Portland", boundaries: "Respect my alone time" },
  { email: "casey.test@positivethots.app", password: "TestPass123!", name: "Casey Nguyen", age: 29, pronouns: "they/them", gender: "Non-binary", gender_preference: "All genders", relationship_style: "Polyamorous", relationship_status: "In a relationship", looking_for: "New connections", interests: ["Fitness","Plants","Cooking","Yoga","Hiking"], experience_level: "experienced", bio: "Fitness coach and plant parent. Big believer in communication and consent as the foundation of everything.", location: "Austin", boundaries: "Regular check-ins are a must" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: string[] = [];

    for (const user of testUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message?.includes("already been registered")) {
          results.push(`${user.name}: already exists, skipped`);
          continue;
        }
        results.push(`${user.name}: auth error - ${authError.message}`);
        continue;
      }

      // Create profile
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
        results.push(`${user.name}: created successfully`);
      }
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
