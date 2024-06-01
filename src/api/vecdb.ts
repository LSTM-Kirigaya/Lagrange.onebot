import { vecdbRequests as r } from './request';

interface CommonResponse<T> {
    code: number,
    data?: T,
    msg?: string
}

type EmptyObject = Record<string, any>;

export const apiQueryVecdb = (req: apiQueryVecdbRequest) => r<CommonResponse<apiQueryVecdbData>>({
    url: '/vecdb/similarity_search_with_score', method: 'POST',
    data: req
});

export interface apiQueryVecdbRequest {
    query: string,
    k?: number
}

export interface apiQueryVecdbDataItem {
    content: string,
    score: number,
    source: string,
    meta: {
        source: string,
        start_index: number
    }
}

export type apiQueryVecdbData = apiQueryVecdbDataItem[];