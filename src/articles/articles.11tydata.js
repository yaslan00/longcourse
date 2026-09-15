import { isLive } from "../../lib/live.js";
export default {
  layout: "article.njk",
  eleventyComputed: {
    permalink: (data) => (isLive(data) ? `/articles/${data.page.fileSlug}/` : false),
    live: (data) => isLive(data)
  }
};
