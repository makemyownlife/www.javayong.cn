import { defineUserConfig } from "vuepress";
import { searchPlugin } from "@vuepress/plugin-search";
import theme from "./theme.js";

export default defineUserConfig({
  dest: "./dist",

  title: "",
  description:
    "Java 基础、高并发三剑客（缓存、消息队列、分库分表）、实战项目讲解。",
  lang: "zh-CN",

  head: [
    // meta
    ["meta", { name: "robots", content: "all" }],
    ["meta", { name: "author", content: "Courage" }],
    [
      "meta",
      {
        "http-equiv": "Cache-Control",
        content: "no-cache, no-store, must-revalidate",
      },
    ],
    ["meta", { "http-equiv": "Pragma", content: "no-cache" }],
    ["meta", { "http-equiv": "Expires", content: "0" }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "Java基础, 多线程, JVM, 消息队列, 虚拟机, 数据库, MySQL, Spring, Redis, MyBatis, 系统设计, 分布式, RPC, 高可用, 高并发",
      },
    ],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    // 添加百度统计
    [
      "script",
      {},
      `var _hmt = _hmt || [];
        (function() {
          var hm = document.createElement("script");
          hm.src = "https://hm.baidu.com/hm.js?137150e962505ffc59b9c326764971af";
          var s = document.getElementsByTagName("script")[0]; 
          s.parentNode.insertBefore(hm, s);
        })();`,
    ],
  ],

  theme,

  plugins: [
    searchPlugin({
      // https://v2.vuepress.vuejs.org/zh/reference/plugin/search.html
      // 排除首页
      isSearchable: (page) => page.path !== "/",
      maxSuggestions: 10,
      hotKeys: ["s", "/"],
      // 用于在页面的搜索索引中添加额外字段
      getExtraFields: () => [],
      locales: {
        "/": {
          placeholder: "搜索",
        },
      },
    }),
    // searchProPlugin({
    //   indexContent: true,
    //   indexOptions: {
    //     tokenize: (text, fieldName) =>
    //       fieldName === "id" ? [text] : cut(text, true),
    //   },
    //   customFields: [
    //     {
    //       getter: ({ frontmatter }) =>
    //         <string | undefined>frontmatter.category ?? null,
    //       formatter: "分类: $content",
    //     },
    //   ],
    //   suggestDelay: 60,
    // }),
  ],

  pagePatterns: ["**/*.md", "!**/*.snippet.md", "!.vuepress", "!node_modules"],

  shouldPrefetch: false,
});
