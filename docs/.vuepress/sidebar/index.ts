import {sidebar} from "vuepress-theme-hope";


export default sidebar({
    // 必须放在最后面
    "/": [
        {
            text: "缓存实战",
            icon: "redis",
            prefix: "cache",
            collapsible: true,
            children: [
                
            ]
        },
        {
            text: "消息队列",
            icon: "MQ",
            prefix: "mq",
            collapsible: true,
            children: [
                {
                    text: "RocketMQ4.X设计精要",
                    prefix: "rocketmq4/",
                    collapsible: true,
                    icon: "",
                    children: [
                        "00RocketMQ4_introduce",
                        "01RocketMQ4_network",
                        "02RocketMQ4_nameserver"
                    ],
                }
            ]
        }
    ]
});
