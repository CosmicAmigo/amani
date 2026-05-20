import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        home: path.resolve(__dirname, "home.html"),
        chat: path.resolve(__dirname, "chat.html"),
        progress: path.resolve(__dirname, "progress.html"),
        friends: path.resolve(__dirname, "friends.html"),
        panic: path.resolve(__dirname, "panic.html"),
      },
    },
  },
});
