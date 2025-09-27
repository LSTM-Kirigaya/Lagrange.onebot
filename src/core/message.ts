import type { Send } from './type';

export function TextMessage(text: string): Send.Text {
    return {
        type: 'text',
        data: { text }
    };
}

export function FaceMessage(id: string): Send.Face {
    return {
        type: 'face',
        data: { id }
    };
}

export function ImageMessage(file: string, options?: Omit<Send.Image['data'], 'file'>): Send.Image {
    return {
        type: 'image',
        data: { file, ...options }
    };
}

export function AudioMessage(file: string, options?: Omit<Send.Audio['data'], 'file'>): Send.Audio {
    return {
        type: 'record',
        data: { file, ...options }
    };
}

export function VideoMessage(file: string, options?: Omit<Send.Video['data'], 'file'>): Send.Video {
    return {
        type: 'video',
        data: { file, ...options }
    };
}

export function AtMessage(qq: string): Send.At {
    return {
        type: 'at',
        data: { qq }
    };
}

export function FingerGuessMessage(): Send.FingerGuess {
    return { type: 'rps', data: {} };
}

export function DiceMessage(): Send.Dice {
    return { type: 'dice', data: {} };
}

export function WindowJitterMessage(): Send.WindowJitter {
    return { type: 'shake', data: {} };
}

export function PokeMessage(type: string, id: string): Send.Poke {
    return {
        type: 'poke',
        data: { type, id }
    };
}

export function AnonymousMessage(): Send.Anonymous {
    return { type: 'anonymous', data: {} };
}

export function LinkMessage(url: string, title: string, content?: string, image?: string): Send.Link {
    return {
        type: 'share',
        data: { url, title, content, image }
    };
}

export function RecommendFriendMessage(id: string): Send.RecommendFriend {
    return {
        type: 'contact',
        data: { type: 'qq', id }
    };
}

export function RecommendGroupMessage(id: string): Send.RecommendGroup {
    return {
        type: 'contact',
        data: { type: 'group', id }
    };
}

export function LocationMessage(lat: string, lon: string, title?: string, content?: string): Send.Location {
    return {
        type: 'location',
        data: { lat, lon, title, content }
    };
}

export function MusicShareMessage(type: 'qq' | '163' | 'xm', id: string): Send.MusicShare {
    return {
        type: 'music',
        data: { type, id }
    };
}

export function CustomMusicShareMessage(url: string, audio: string, title: string, content: string, image: string): Send.CustomMusicShare {
    return {
        type: 'music',
        data: { type: 'custom', url, audio, title, content, image }
    };
}

export function ReplyMessage(id: string): Send.Reply {
    return {
        type: 'reply',
        data: { id }
    };
}

export function ForwardNodeMessage(id: string): Send.ForwardNode {
    return {
        type: 'node',
        data: { id }
    };
}

export function XMLMessage(data: string): Send.XML {
    return {
        type: 'xml',
        data: { data }
    };
}

export function JSONMessage(data: string): Send.JSON {
    return {
        type: 'json',
        data: { data }
    };
}
