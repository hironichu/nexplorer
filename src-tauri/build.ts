import sass from "https://deno.land/x/denosass@1.0.5/mod.ts";

const Scss = sass(["src/assets/scss/style.scss"], {
    load_paths: [
      "./src/assets/scss",
    ]
});

Scss.to_file({
    destDir: "./src/assets/css",
    format: "compressed",
});
