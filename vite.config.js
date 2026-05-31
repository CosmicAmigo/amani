import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        home: path.resolve(__dirname, "home.html"),
        dashboard: path.resolve(__dirname, "dashboard.html"),
        chat: path.resolve(__dirname, "chat.html"),
        progress: path.resolve(__dirname, "progress.html"),
        friends: path.resolve(__dirname, "friends.html"),
        lobby: path.resolve(__dirname, "lobby.html"),
        panic: path.resolve(__dirname, "panic.html"),
      },
    },
  },
});
