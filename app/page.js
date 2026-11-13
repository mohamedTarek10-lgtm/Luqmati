import HomeClient from "../components/home/home-client";

// This route intentionally does no auth() work, so the shell is prerendered
// and served from the CDN. Signed-in data loads inside the client island.
export default function HomePage() {
  return <HomeClient />;
}
