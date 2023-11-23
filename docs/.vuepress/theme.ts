import { getDirname, path } from "@vuepress/utils";
import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar/index.js";

const __dirname = getDirname(import.meta.url);

export default hopeTheme({
  hostname: "https://javayong.cn/",
  logo: "/logo.png",
  favicon: "/favicon.ico",

  iconAssets: [
       "https://at.alicdn.com/t/c/font_2922463_kweia6fbo9.css",
        "https://at.alicdn.com/t/c/font_4335276_4phw50gppkl.css"
  ],

  author: {
    name: "勇哥",
    url: "https://javayong.cn/article/",
  },

  repo: "https://github.com/makemyownlife/www.javayong.cn",
  docsDir: "docs",
  docsBranch: "master",
  pure: true,
  breadcrumb: false,
  navbar,
  sidebar,
  footer:
    '<a href="https://beian.miit.gov.cn/" target="_blank">鄂ICP备2023011240号-1</a>',
  displayFooter: true,

  pageInfo: [
    "Author",
    "Category",
    "Tag",
    "Date",
    "Original",
    "Word",
    "ReadingTime",
  ],

  blog: {
    intro: "/about-the-author/",
    sidebarDisplay: "mobile",
    medias: {
      Zhihu: "https://www.zhihu.com/people/makemyownlife",
      Github: "https://github.com/makemyownlife",
      Gitee: "https://gitee.com/makemyownlife",
    },
  },

  plugins: {
    blog: true,
    copyright: true,
    mdEnhance: {
      align: true,
      codetabs: true,
      container: true,
      figure: true,
      include: {
        resolvePath: (file, cwd) => {
          if (file.startsWith("@"))
            return path.resolve(
              __dirname,
              "../snippets",
              file.replace("@", "./")
            );

          return path.resolve(cwd, file);
        },
      },
      tasklist: true,
    },
    feed: {
      atom: true,
      json: true,
      rss: true,
    },
  },
});
