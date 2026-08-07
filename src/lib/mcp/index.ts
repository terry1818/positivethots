import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCoursesTool from "./tools/list-courses";
import getCourseTool from "./tools/get-course";
import myLearningProgressTool from "./tools/my-learning-progress";
import myConnectionsTool from "./tools/my-connections";
import updateMyBioTool from "./tools/update-my-bio";

// Build the OAuth issuer from the project ref (inlined at build time, import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "positivethots-app",
  title: "PositiveThots.app",
  version: "0.1.0",
  instructions:
    "Tools for Positive Thots, an education-gated dating app for ENM, polyamory, and LGBTQ+ communities. " +
    "Use `list_courses` and `get_course` to explore the badge curriculum. Use `my_learning_progress` and " +
    "`my_connections` for the signed-in user's own data, and `update_my_bio` to edit their About Me text. " +
    "Branded language matters: say 'Connect' (not like/swipe right), 'Pass' (not reject), " +
    "'Send a Thot' (not super like), and 'You Both Said Yes' (not it's a match).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCoursesTool,
    getCourseTool,
    myLearningProgressTool,
    myConnectionsTool,
    updateMyBioTool,
  ],
});
