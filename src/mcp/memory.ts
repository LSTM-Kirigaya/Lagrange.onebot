import { connect } from "@lancedb/lancedb";
import { pipeline, Tensor, env } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";

export type MemoryOptions = {
  DB_DIR?: string;
  TABLE?: string;
  MODEL?: string;
  k?: number;
  cacheDir?: string;         // ← 可选：transformers.js 缓存目录
  warmupText?: string;       // ← 可选：预热使用的短文本
};

export class Memory {
  DB_DIR: string = ".data";                // 数据库存储目录（建议为目录路径）
  TABLE: string = "memory";                          // 表名
  MODEL: string = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";         // 使用的embedding模型
  k: number = 5;
  private _embedder: any | null = null;
  private _inited = false;
  private _warm = false;
  private _warmupText = "你好";

  constructor(opts: MemoryOptions = {}) {
    if (opts.DB_DIR) this.DB_DIR = opts.DB_DIR;
    if (opts.TABLE) this.TABLE = opts.TABLE;
    if (opts.MODEL) this.MODEL = opts.MODEL;
    if (typeof opts.k === "number") this.k = opts.k;
    if (opts.warmupText) this._warmupText = opts.warmupText;

    // 配置 transformers.js 的缓存目录（可选）
    if (opts.cacheDir) {
      env.cacheDir = opts.cacheDir;              // e.g. ".cache/transformers"
      env.allowLocalModels = true;               // 允许从本地缓存加载
    }

  }
  /**
  * 工厂函数：一行搞定实例化 + 预下载 + 预热
  */
  static async create(opts: MemoryOptions = {}): Promise<Memory> {
    const mem = new Memory(opts);
    await mem.init();
    await mem.warmup();
    return mem;
  }

  /**
   * 预下载并加载模型
   */
  async init() {
    if (this._inited) return;
    this._embedder = await pipeline("feature-extraction", this.MODEL);
    this._inited = true;
  }

  /**
   * 预热
   */
  async warmup() {
    if (this._warm) return;
    await this.embed(this._warmupText);
    this._warm = true;
  }

  /**
   * 添加记忆
   * @param content 多条文本
   * @param groupId 群组 ID（必须提供）
   * @param key 唯一标识（可选；不传则每条生成 uuid）
   * @returns JSON：{ inserted, items: [{key, groupId}] }
   */
  async addMemory(content: string[], groupId: string, key?: string): Promise<string> {
    const items: Array<{ key: string; groupId: string; content: string; vector: number[]; ts: number }> = [];
    for (const text of content) {
      const k = key && key.trim() !== "" ? key : uuidv4();
      const vec = await this.embed(text);
      items.push({ key: k, groupId, content: text, vector: vec, ts: Date.now() });
    }


    if (items.length === 0) {
      return JSON.stringify({ inserted: 0, items: [] });
    }

    // 尝试打开；如果不存在则用首行创建
    let tbl;
    try {
      tbl = await this.openTable();
    } catch {
      tbl = await this.createTableWithFirstRow(items[0]);
      if (items.length > 1) {
        await tbl.add(items.slice(1));
        // 添加延迟确保数据写入
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return JSON.stringify({
        inserted: items.length,
        items: items.map(i => ({ key: i.key, groupId: i.groupId })),
      });
    }

    await tbl.add(items);
    // 给数据库一点时间来完成操作
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.stringify({
      inserted: items.length,
      items: items.map(i => ({ key: i.key, groupId: i.groupId })),
    });
  }

  /**
   * 查询记忆（语义检索）
   * @param query 查询文本
   * @param groupIds 群组 ID 列表（必须提供）
   * @param k 返回条数（可选）
   * @returns JSON：{ query, results: [{key, groupId, content, score}] } 或 警告信息
   */
  async queryMemory(query: string, groupIds: string[], k = this.k): Promise<string> {
    let tbl;
    try {
      tbl = await this.openTable();
    } catch {
      // 表不存在时返回警告
      return JSON.stringify({
        query,
        warning: "当前记忆数据库中暂无任何记忆记录",
        availableGroupIds: [],
        results: []
      });
    }

    const qv = await this.embed(query);

    try {
      // LanceDB 的 .search().where() 在某些情况下可能不生效
      // 因此改用应用层过滤：先取足够多的候选，再过滤 groupId
      const groupIdSet = new Set(groupIds);
      const limitK = Math.max(k * 100, 1000);
      const allRows = await tbl
        .search(qv)
        .limit(limitK)
        .toArray();

      // 在应用层过滤 groupId 并截取 topK
      const rows = allRows.filter((r: any) => groupIdSet.has(r.groupId)).slice(0, k);

      if (rows.length === 0) {
        // 查询无结果，获取所有可用的 groupIds
        const allGroupIds = await this.getAllGroupIds(tbl);
        return JSON.stringify({
          query,
          warning: `指定的群组 (${groupIds.join(', ')}) 中暂无相关记忆记录`,
          availableGroupIds: allGroupIds,
          results: []
        });
      }

      const results = rows.map((r: any) => ({
        key: r.key,
        groupId: r.groupId,
        content: r.content,
        score: r._distance ?? r.score ?? r.distance ?? null,
      }));

      return JSON.stringify({ query, results });
    } catch (e) {
      console.error(`[Memory] queryMemory error:`, e);
      // 发生错误时尝试获取所有 groupIds
      const allGroupIds = await this.getAllGroupIds(tbl);
      return JSON.stringify({
        query,
        warning: `查询出错: ${(e as any).message}`,
        availableGroupIds: allGroupIds,
        results: []
      });
    }
  }

  /**
   * 更新记忆（把相同 groupId+key 的旧记录删掉后，插入新内容）
   * @param groupId 群组 ID
   * @param key 唯一标识
   * @param content 新内容（多条）
   * @returns JSON：{ deleted, inserted }
   */
  async updateMemory(groupId: string, key: string, content: string[]): Promise<string> {
    let tbl;
    try {
      tbl = await this.openTable();
    } catch {
      // 若表不存在，则等价于插入（也可以直接返回 0 删除）
      const insertedReport = await this.addMemory(content, groupId, key);
      const { inserted } = JSON.parse(insertedReport);
      return JSON.stringify({ deleted: 0, inserted });
    }

    const where = `"groupId" = '${this.escapeQuote(groupId)}' AND "key" = '${this.escapeQuote(key)}'`;
    const deleted = await tbl.delete(where);

    const rows = [];
    for (const text of content) {
      const vec = await this.embed(text);
      rows.push({ key, groupId, content: text, vector: vec, ts: Date.now() });
    }
    let inserted = 0;
    if (rows.length > 0) {
      await tbl.add(rows);
      inserted = rows.length;
    }

    return JSON.stringify({ deleted, inserted });
  }

  /**
   * 删除记忆
   * @param groupId 群组 ID
   * @param key 唯一标识
   * @returns JSON：{ deleted }
   */
  async deleteMemory(groupId: string, key: string): Promise<string> {
    let tbl;
    try {
      tbl = await this.openTable();
    } catch {
      // 表不存在则视为删除 0
      return JSON.stringify({ deleted: 0 });
    }

    const where = `"groupId" = '${this.escapeQuote(groupId)}' AND "key" = '${this.escapeQuote(key)}'`;
    const deleted = await tbl.delete(where);
    return JSON.stringify({ deleted });
  }


  private async getEmbedder() {
    if (this._embedder) return this._embedder;
    // feature-extraction -> 句向量；pooling/normalize 让输出成为 1 x D
    this._embedder = await pipeline("feature-extraction", this.MODEL);
    return this._embedder;
  }

  private async embed(text: string): Promise<number[]> {
    const emb = await (await this.getEmbedder())(text, { pooling: "mean", normalize: true });
    if (emb instanceof Tensor) return Array.from(emb.data as Float32Array);
    if (Array.isArray((emb as any).data)) return Array.from((emb as any).data as Float32Array);
    const arr = (emb as any)[0] || emb;
    const D = arr[0].length;
    const out = new Array(D).fill(0);
    for (const row of arr) for (let i = 0; i < D; i++) out[i] += row[i];
    for (let i = 0; i < D; i++) out[i] /= arr.length;
    return out;
  }

  // 仅打开已存在表
  private async openTable() {
    const db = await connect(this.DB_DIR);
    return await db.openTable(this.TABLE);
  }

  // 用首条记录创建表（新版 API：必须提供非空 data）
  private async createTableWithFirstRow(firstRow: any) {
    const db = await connect(this.DB_DIR);
    const tbl = await db.createTable({ name: this.TABLE, data: [firstRow], mode: "overwrite" });
    // 给数据库一点时间来完成操作
    await new Promise(resolve => setTimeout(resolve, 500));
    return tbl;
  }

  /**
   * 获取所有存在记录的 groupIds
   */
  private async getAllGroupIds(tbl: any): Promise<string[]> {
    try {
      // 使用一个伪向量搜索来获取所有记录
      const zeroVector = new Array(384).fill(0); // 假设向量维度为 384
      const rows = await tbl
        .search(zeroVector)
        .limit(10000) // 获取最多 10000 条
        .select(["groupId"])
        .toArray();

      // 提取唯一的 groupIds
      const allGroupIds = Array.from(new Set(rows.map((r: any) => r.groupId) as string[]));
      return allGroupIds as string[];
    } catch (e) {
      return [];
    }
  }

  private escapeQuote(s: string) {
    return s.replace(/'/g, "''");
  }
}
