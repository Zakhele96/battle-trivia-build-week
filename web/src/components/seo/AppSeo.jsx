import { useLocation } from "react-router-dom";
import { useSeo } from "../../hooks/useSeo";

function getSeoConfig(pathname) {
  if (pathname === "/share/leaderboard") {
    return null;
  }

  if (pathname === "/") {
    return {
      title: "BTS",
      description:
        "Live competition app with Battle Trivia, Word Scramble, weekly leaderboards, squads, alerts, and direct messages.",
      canonicalPath: "/",
      robots: "noindex,nofollow",
    };
  }

  if (pathname === "/login") {
    return {
      title: "Login",
      description:
        "Log in to BTS to jump back into Battle Trivia, Word Scramble, weekly standings, direct messages, and your player profile.",
      canonicalPath: "/login",
      robots: "noindex,nofollow",
    };
  }

  if (pathname === "/register") {
    return {
      title: "Create Account",
      description:
        "Create your BTS account to compete in Battle Trivia, Word Scramble, squads, weekly leaderboards, and social play.",
      canonicalPath: "/register",
      robots: "noindex,nofollow",
    };
  }

  if (pathname === "/support") {
    return {
      title: "Support BTS",
      description:
        "Support BTS with a lightweight monthly supporter plan or a compliant support page that helps fund the app.",
      canonicalPath: "/support",
      robots: "noindex,nofollow",
    };
  }

  return {
    title: "Player App",
    description:
      "BTS player app for live rooms, weekly leaderboards, direct messages, alerts, squads, and profile tracking.",
    canonicalPath: pathname,
    robots: "noindex,nofollow",
  };
}

export default function AppSeo() {
  const location = useLocation();
  const config = getSeoConfig(location.pathname);

  useSeo(config || {});

  return null;
}
