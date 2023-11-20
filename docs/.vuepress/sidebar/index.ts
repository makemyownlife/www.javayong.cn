import {sidebar} from "vuepress-theme-hope";

export default sidebar({
    // 必须放在最后面
    "/": [
        {
            text: "缓存实战",
            icon: "buffer",
            prefix: "cache",
            collapsible: true,
            children: [
                "00localandclustercache",
                "01fourJDKlocalcache",
                "02pagelistcache",
                "05boolfilter",
                "07Redistransaction",
                "09SpringCache",
            ]
        },
        {
            text: "消息队列",
            icon: "Kafka",
            prefix: "mq",
            collapsible: true,
            children: [
                {
                    text: "RocketMQ4.X设计精要",
                    prefix: "rocketmq4/",
                    collapsible: true,
                    icon: "apacherocketmq",
                    children: [
                        "00RocketMQ4_introduce",
                        "01RocketMQ4_artch",
                        "01RocketMQ4_network",
                        "02RocketMQ4_nameserver",
                        "03RocketMQ4_producer",
                        "04RocketMQ4_store",
                        "06RocketMQ4_consumer",
                        "07RocketMQ4_broadcast_consumer",
                        "08RocketMQ4_masterslave",
                        "10RocketMQ4_transaction",
                        "11RocketMQ4_messagetrack",
                        "13RocketMQ4_subscribe_consistent"
                    ],
                }
            ]
        },
        {
            text: "技术人生",
            icon: "life-ring",
            prefix: "codelife",
            collapsible: true,
            children: [
                "runningforcode.md",
                "messagequeuecareer.md",
                "howtolearnopenproject.md",
            ]
        }
    ]
});
