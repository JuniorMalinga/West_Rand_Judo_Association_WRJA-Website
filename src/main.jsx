import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/programs.css";
import "./styles/competitions.css";
import "./styles/events.css";
import "./styles/news.css";
import "./styles/about.css";
import "./styles/contact.css";
import "./styles/auth.css";
import "./styles/gallery.css";
import "./styles/booking.css";
import "./styles/chat.css";
import "./styles/admin.css";
import "./styles/notfound.css";
import "./styles/faq.css";
import "./styles/instructors.css";
import "./styles/eventdetail.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

async function bootstrap() {
  try {
    const { default: App } = await import("./App.jsx");

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to bootstrap the app:", error);
    root.render(<pre>{error?.stack || String(error)}</pre>);
  }
}

bootstrap();
