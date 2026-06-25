import { redirect } from "next/navigation";

// Root entry → /chat is the default landing page per wireframe.
export default function RootPage() {
  redirect("/chat");
}
