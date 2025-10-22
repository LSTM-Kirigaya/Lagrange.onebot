import { z } from 'zod';

export const Text = z.object({
    type: z.literal('text'),
    data: z.object({
        text: z.string()
    })
});

export const Face = z.object({
    type: z.literal('face'),
    data: z.object({
        id: z.string()
    })
});

export const Image = z.object({
    type: z.literal('image'),
    data: z.object({
        file: z.string(),
        cache: z.union([z.literal(0), z.literal(1)]).optional(),
        proxy: z.union([z.literal(0), z.literal(1)]).optional(),
        timeout: z.number().optional()
    })
});

export const Audio = z.object({
    type: z.literal('record'),
    data: z.object({
        file: z.string(),
        magic: z.union([z.literal(0), z.literal(1)]).optional(),
        cache: z.union([z.literal(0), z.literal(1)]).optional(),
        proxy: z.union([z.literal(0), z.literal(1)]).optional(),
        timeout: z.number().optional()
    })
});

export const Video = z.object({
    type: z.literal('video'),
    data: z.object({
        file: z.string(),
        cache: z.union([z.literal(0), z.literal(1)]).optional(),
        proxy: z.union([z.literal(0), z.literal(1)]).optional(),
        timeout: z.number().optional()
    })
});

export const At = z.object({
    type: z.literal('at'),
    data: z.object({
        qq: z.union([
            z.string(),
            z.number()
        ])
    })
});

export const FingerGuess = z.object({
    type: z.literal('rps'),
    data: z.object({})
});

export const Dice = z.object({
    type: z.literal('dice'),
    data: z.object({})
});

export const WindowJitter = z.object({
    type: z.literal('shake'),
    data: z.object({})
});

export const Poke = z.object({
    type: z.literal('poke'),
    data: z.object({
        type: z.string(),
        id: z.string()
    })
});

export const Anonymous = z.object({
    type: z.literal('anonymous'),
    data: z.object({})
});

export const Link = z.object({
    type: z.literal('share'),
    data: z.object({
        url: z.string(),
        title: z.string(),
        content: z.string().optional(),
        image: z.string().optional()
    })
});

export const RecommendFriend = z.object({
    type: z.literal('contact'),
    data: z.object({
        type: z.literal('qq'),
        id: z.string()
    })
});

export const RecommendGroup = z.object({
    type: z.literal('contact'),
    data: z.object({
        type: z.literal('group'),
        id: z.string()
    })
});

export const Location = z.object({
    type: z.literal('location'),
    data: z.object({
        lat: z.string(),
        lon: z.string(),
        title: z.string().optional(),
        content: z.string().optional()
    })
});

export const MusicShare = z.object({
    type: z.literal('music'),
    data: z.object({
        type: z.union([z.literal('qq'), z.literal('163'), z.literal('xm')]),
        id: z.string()
    })
});

export const CustomMusicShare = z.object({
    type: z.literal('music'),
    data: z.object({
        type: z.literal('custom'),
        url: z.string(),
        audio: z.string(),
        title: z.string(),
        content: z.string(),
        image: z.string()
    })
});

export const Reply = z.object({
    type: z.literal('reply'),
    data: z.object({
        id: z.string()
    })
});

export const ForwardNode = z.object({
    type: z.literal('node'),
    data: z.object({
        id: z.string()
    })
});

export const XML = z.object({
    type: z.literal('xml'),
    data: z.object({
        data: z.string()
    })
});

export const JSON = z.object({
    type: z.literal('json'),
    data: z.object({
        data: z.string()
    })
});

// 联合类型
export const Default = z.union([
    Text,
    // Face,
    // Image,
    // Audio,
    // Video,
    At,
    // FingerGuess,
    // Dice,
    // WindowJitter,
    // Poke,
    // Anonymous,
    // Link,
    // RecommendFriend,
    // RecommendGroup,
    // Location,
    // MusicShare,
    // CustomMusicShare,
    // Reply,
    // ForwardNode,
    // XML,
    // JSON
]);
