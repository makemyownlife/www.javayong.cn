import { sidebar } from "vuepress-theme-hope";


export default sidebar({
  // 必须放在最后面
  "/mq": [
    {
      text: "消息队列",
      icon: "card",
      collapsible: true,
      children: ["intro", "use-suggestion", "contribution-guideline", "faq"],
    }
    ]
});
