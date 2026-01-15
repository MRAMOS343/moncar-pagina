import { APP_VERSION, GIT_COMMIT, GIT_BRANCH, BUILD_TIME } from "@/version.generated";

export function BuildInfo() {
  const formattedDate = new Date(BUILD_TIME).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <p className="text-xs text-muted-foreground text-center">
      Build v{APP_VERSION} ({GIT_BRANCH}@{GIT_COMMIT}) · {formattedDate}
    </p>
  );
}
