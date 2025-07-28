import type { Plugin } from "vite";
import path from "node:path";

interface Options {
  /**
   * Path to the public directory (relative to project root).
   * @default 'public'
   */
  publicDir?: string;
  /**
   * Path to the generated file (relative or absolute).
   * @default 'src/generated.ts'
   */
  output?: string;
  /**
   * Name of the TypeScript type to generate.
   * @default 'PublicAssets'
   */
  variableName?: string;
  /**
   * Start of the auto generated content.
   * @default '//#region vite-plugin-public-assets-types DO NOT EDIT'
   */
  start?: string;
  /**
   * End of the auto generated content.
   * @default '//#endregion vite-plugin-public-assets-types'
   */
  end?: string;
}

function publicAssetsPlugin(options: Options = {}): Plugin {
  const publicDir = options.publicDir ?? "public";
  const output = options.output ?? "src/generated.ts";
  const varName = options.variableName ?? "PublicAssets";
  const start =
    options.start ?? "//#region vite-plugin-public-assets-types DO NOT EDIT";
  const end = options.end ?? "//#endregion vite-plugin-public-assets-types";

  return {
    name: "vite-plugin-public-assets-types",
    enforce: "pre",
    async buildStart(ctx) {
      const fs = ctx.fs;
      const dir = path.resolve(process.cwd(), publicDir);
      const files: string[] = [];

      async function walk(current: string) {
        for (const name of await fs.readdir(current)) {
          const fullPath = path.join(current, name);
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            await walk(fullPath);
          } else {
            const relPath = path
              .relative(dir, fullPath)
              .split(path.sep)
              .join("/");
            files.push(`/${relPath}`);
          }
        }
      }

      async function exists(file: string) {
        try {
          await fs.stat(file);
          return true;
        } catch (e) {
          if ((e as { code?: string }).code === "ENOENT") return false;
          throw e;
        }
      }

      if (await exists(dir)) {
        await walk(dir);
      }

      // Build the union type source
      const unionLines: string[] = [];
      unionLines.push(start);
      unionLines.push(`export type ${varName} =`);
      if (files.length > 0) {
        files.forEach((f, idx) => {
          const suffix = idx === files.length - 1 ? ";" : " |";
          unionLines.push(`  "${f}"${suffix}`);
        });
      } else {
        unionLines.push("  never;");
      }
      unionLines.push(end);
      unionLines.push("");

      // Ensure the output directory exists
      const outDir = path.dirname(output);
      await fs.mkdir(outDir, { recursive: true });
      // if the file has the region, replace only the region. Otherwise, append to the end of the file.
      let content = (await exists(output))
        ? await fs.readFile(output, { encoding: "utf8" })
        : "";
      if (content.includes(start) && content.includes(end)) {
        const startIndex = content.indexOf(start);
        const endIndex = content.indexOf(end);
        content =
          content.slice(0, startIndex) +
          unionLines.join("\n") +
          content.slice(endIndex + end.length);
      } else {
        content += unionLines.join("\n");
      }
      fs.writeFile(output, content);
    },
  };
}

export { publicAssetsPlugin };
export default publicAssetsPlugin;
