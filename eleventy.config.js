import { DateTime } from "luxon";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import rssPlugin from "@11ty/eleventy-plugin-rss";
import { isLive, SHOW_DRAFTS, NOW } from "./lib/live.js";


export const LANES = {
  fuel: { name: "Fuel", blurb: "Training, recovery, hydration, and energy for active people." },
  everyday: { name: "Everyday", blurb: "Plain explanations of foods, nutrients, and habits." },
  headlines: { name: "Headlines", blurb: "How to read nutrition research and news without getting played." },
  flexibility: { name: "Flexibility", blurb: "Hunger, fullness, and eating without rules." }
};

// Flexibility content never sits beside weight or calorie focused material.
const RELATED_ALLOWED = {
  fuel: ["fuel", "everyday", "headlines"],
  everyday: ["everyday", "fuel", "headlines", "flexibility"],
  headlines: ["headlines", "everyday", "fuel", "flexibility"],
  flexibility: ["flexibility", "headlines", "everyday"]
};


export default function (eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);

  const md = markdownIt({ html: true, linkify: true, typographer: false })
    .use(markdownItAnchor, { level: [2, 3], tabIndex: false });
  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");

  eleventyConfig.addGlobalData("lanes", LANES);
  eleventyConfig.addGlobalData("buildTime", NOW.toISO());
  eleventyConfig.addGlobalData("showDrafts", SHOW_DRAFTS);

  eleventyConfig.addCollection("articles", (api) =>
    api.getFilteredByGlob("src/articles/*.md")
      .filter((p) => isLive(p.data))
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("drafts", (api) =>
    api.getFilteredByGlob("src/articles/*.md")
      .filter((p) => !isLive(p.data))
      .sort((a, b) => a.date - b.date)
  );
  eleventyConfig.addCollection("allArticles", (api) =>
    api.getFilteredByGlob("src/articles/*.md").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("readableDate", (d) =>
    DateTime.fromJSDate(d, { zone: "utc" }).toFormat("d LLLL yyyy")
  );
  eleventyConfig.addFilter("isoDate", (d) =>
    DateTime.fromJSDate(d, { zone: "utc" }).toISODate()
  );
  eleventyConfig.addFilter("laneName", (k) => (LANES[k] ? LANES[k].name : k));
  eleventyConfig.addFilter("byLane", (arr, lane) => arr.filter((p) => p.data.lane === lane));
  eleventyConfig.addFilter("related", (arr, url, lane, tagList, n = 3) => {
    const allowed = RELATED_ALLOWED[lane] || Object.keys(LANES);
    const tags = new Set(tagList || []);
    return arr
      .filter((p) => p.url !== url && allowed.includes(p.data.lane))
      .map((p) => ({ p, score: (p.data.lane === lane ? 2 : 0) + (p.data.tags || []).filter((t) => tags.has(t)).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((x) => x.p);
  });
  eleventyConfig.addFilter("excerptHtml", (content) => {
    const m = content.match(/<p>([\s\S]*?)<\/p>/);
    return m ? m[1].replace(/<[^>]+>/g, "") : "";
  });
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("jsonify", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("plain", (html) => (html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  eleventyConfig.addFilter("wordcount", (html) => (html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length);

  // Wrap the evidence / interpretation / practice trio in a styled box.
  eleventyConfig.addTransform("eip", (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return content.replace(
      /(<p><strong>What the evidence shows:<\/strong>[\s\S]*?<\/p>\s*<p><strong>Our interpretation:<\/strong>[\s\S]*?<\/p>\s*<p><strong>In practice \(example\):<\/strong>[\s\S]*?<\/p>)/,
      '<div class="eip">$1</div>'
    );
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk"
  };
}
