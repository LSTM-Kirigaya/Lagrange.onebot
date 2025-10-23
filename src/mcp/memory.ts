import { connect } from "@lancedb/lancedb";
import { pipeline, Tensor } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";

export type MemoryOptions = {
  DB_DIR?: string;
  TABLE?: string;
  MODEL?: string;
  k?: number;
};

export class Memory {
  DB_DIR: string = ".data";                // 数据库存储目录（建议为目录路径）
  TABLE: string = "memory";                          // 表名
  MODEL: string = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";         // 使用的embedding模型
  k: number = 5;

  private _embedder: any | null = null;

  constructor(opts: MemoryOptions = {}) {
    if (opts.DB_DIR) this.DB_DIR = opts.DB_DIR;
    if (opts.TABLE) this.TABLE = opts.TABLE;
    if (opts.MODEL) this.MODEL = opts.MODEL;
    if (typeof opts.k === "number") this.k = opts.k;
  }

  /**
   * 添加记忆
   * @param content 多条文本
   * @param namespaces 命名空间（不传则 "default"）
   * @param key 唯一标识（可选；不传则每条生成 uuid）
   * @returns JSON：{ inserted, items: [{key, namespace}] }
   */
  async addMemory(content: string[], namespaces?: string[], key?: string): Promise<string> {
    const nss = this.nsList(namespaces);

    const items: Array<{ key: string; namespace: string; content: string; vector: number[]; ts: number }> = [];
    for (const ns of nss) {
      for (const text of content) {
        const k = key && key.trim() !== "" ? key : uuidv4();
        const vec = await this.embed(text);
        items.push({ key: k, namespace: ns, content: text, vector: vec, ts: Date.now() });
      }
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
      }
      return JSON.stringify({
        inserted: items.length,
        items: items.map(i => ({ key: i.key, namespace: i.namespace })),
      });
    }

    await tbl.add(items);
    return JSON.stringify({
      inserted: items.length,
      items: items.map(i => ({ key: i.key, namespace: i.namespace })),
    });
  }

  /**
   * 查询记忆（语义检索）
   * @param query 查询文本
   * @param namespaces 命名空间（可选；默认 "default"）
   * @param k 返回条数（可选）
   * @returns JSON：{ query, results: [{key, namespace, content, score}] }
   */
  async queryMemory(query: string, namespaces?: string[], k = this.k): Promise<string> {
    let tbl;
    try {
      tbl = await this.openTable();
    } catch {
      // 表不存在时返回空结果
      return JSON.stringify({ query, results: [] });
    }

    const qv = await this.embed(query);
    const nss = this.nsList(namespaces);

    const where =
      nss.length === 1
        ? `namespace = '${this.escapeQuote(nss[0])}'`
        : `namespace IN (${nss.map(s => `'${this.escapeQuote(s)}'`).join(",")})`;

    const rows = await tbl
      .search(qv)
      .where(where)
      .limit(k)
      .select(["key", "namespace", "content", "_distance"])
      .toArray();

    const results = rows.map((r: any) => ({
      key: r.key,
      namespace: r.namespace,
      content: r.content,
      score: r._distance ?? r.score ?? r.distance ?? null,
    }));

    return JSON.stringify({ query, results });
  }

  /**
   * 更新记忆（把相同 namespace+key 的旧记录删掉后，插入新内容）
   * @param namespace 命名空间
   * @param key 唯一标识
   * @param content 新内容（多条）
   * @returns JSON：{ deleted, inserted }
   */
  async updateMemory(namespace: string, key: string, content: string[]): Promise<string> {
    let tbl;
    try {
      tbl = await this.openTable();
    } catch {
      // 若表不存在，则等价于插入（也可以直接返回 0 删除）
      const insertedReport = await this.addMemory(content, [namespace], key);
      const { inserted } = JSON.parse(insertedReport);
      return JSON.stringify({ deleted: 0, inserted });
    }

    const where = `namespace = '${this.escapeQuote(namespace)}' AND key = '${this.escapeQuote(key)}'`;
    const deleted = await tbl.delete(where);

    const rows = [];
    for (const text of content) {
      const vec = await this.embed(text);
      rows.push({ key, namespace, content: text, vector: vec, ts: Date.now() });
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
   * @param namespace 命名空间
   * @param key 唯一标识
   * @returns JSON：{ deleted }
   */
  async deleteMemory(namespace: string, key: string): Promise<string> {
    let tbl;
    try {
      tbl = await this.openTable();
    } catch {
      // 表不存在则视为删除 0
      return JSON.stringify({ deleted: 0 });
    }

    const where = `namespace = '${this.escapeQuote(namespace)}' AND key = '${this.escapeQuote(key)}'`;
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
    return await db.createTable({ name: this.TABLE, data: [firstRow] });
    // 如需命名空间：第二个参数传 string[]，例如 []
    // return await db.createTable({ name: this.TABLE, data: [firstRow] }, []);
  }

  private nsList(namespaces?: string[]): string[] {
    if (!namespaces || namespaces.length === 0) return ["default"];
    return namespaces;
  }

  private escapeQuote(s: string) {
    return s.replace(/'/g, "''");
  }
}
