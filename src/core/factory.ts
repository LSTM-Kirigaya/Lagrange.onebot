import server from './context';
import { Send } from './type';

export function create(controllers: any[] = []) {
    controllers.forEach(controller => {
        server.addController(controller);
    });

    return server;
}

// === Text ===
export function Text(text: string): Send.Text {
    return {
        type: 'text',
        data: { text }
    };
}

// === Face ===
export function Face(id: string): Send.Face {
    return {
        type: 'face',
        data: { id }
    };
}

// === Image ===
export function Image(
    file: string,
    options?: { cache?: 0 | 1; proxy?: 0 | 1; timeout?: number }
): Send.Image {
    return {
        type: 'image',
        data: { file, ...options }
    };
}

// === Audio ===
export function Audio(
    file: string,
    options?: { magic?: 0 | 1; cache?: 0 | 1; proxy?: 0 | 1; timeout?: number }
): Send.Audio {
    return {
        type: 'record',
        data: { file, ...options }
    };
}

// === Video ===
export function Video(
    file: string,
    options?: { cache?: 0 | 1; proxy?: 0 | 1; timeout?: number }
): Send.Video {
    return {
        type: 'video',
        data: { file, ...options }
    };
}

// === At ===
export function At(qq: string): Send.At {
    return {
        type: 'at',
        data: { qq }
    };
}

// === FingerGuess ===
export function FingerGuess(): Send.FingerGuess {
    return { type: 'rps', data: {} };
}

// === Dice ===
export function Dice(): Send.Dice {
    return { type: 'dice', data: {} };
}

// === WindowJitter ===
export function WindowJitter(): Send.WindowJitter {
    return { type: 'shake', data: {} };
}

// === Poke ===
export function Poke(type: string, id: string): Send.Poke {
    return {
        type: 'poke',
        data: { type, id }
    };
}

// === Anonymous ===
export function Anonymous(): Send.Anonymous {
    return { type: 'anonymous', data: {} };
}

// === Link ===
export function Link(
    url: string,
    title: string,
    content?: string,
    image?: string
): Send.Link {
    return {
        type: 'share',
        data: { url, title, content, image }
    };
}

// === RecommendFriend ===
export function RecommendFriend(id: string): Send.RecommendFriend {
    return {
        type: 'contact',
        data: { type: 'qq', id }
    };
}

// === RecommendGroup ===
export function RecommendGroup(id: string): Send.RecommendGroup {
    return {
        type: 'contact',
        data: { type: 'group', id }
    };
}

// === Location ===
export function Location(
    lat: string,
    lon: string,
    title?: string,
    content?: string
): Send.Location {
    return {
        type: 'location',
        data: { lat, lon, title, content }
    };
}

// === MusicShare ===
export function MusicShare(
    type: 'qq' | '163' | 'xm',
    id: string
): Send.MusicShare {
    return {
        type: 'music',
        data: { type, id }
    };
}

// === CustomMusicShare ===
export function CustomMusicShare(
    url: string,
    audio: string,
    title: string,
    content: string,
    image: string
): Send.CustomMusicShare {
    return {
        type: 'music',
        data: { type: 'custom', url, audio, title, content, image }
    };
}

// === Reply ===
export function Reply(id: string): Send.Reply {
    return {
        type: 'reply',
        data: { id }
    };
}

// === ForwardNode ===
export function ForwardNode(id: string): Send.ForwardNode {
    return {
        type: 'node',
        data: { id }
    };
}

// === XML ===
export function XML(data: string): Send.XML {
    return {
        type: 'xml',
        data: { data }
    };
}

// === JSON ===
export function JSON(data: string): Send.JSON {
    return {
        type: 'json',
        data: { data }
    };
}
