/* js/storage.js — localStorage 持久化与导入导出 */

const AnimeStorage = {
  KEY: 'anime_tracker_data',

  /** 读取本地数据；无数据时返回初始结构 */
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return { version: '1.0', animeList: [] };
      const data = JSON.parse(raw);
      // 版本兼容：老数据缺 version 字段时自动补上并回写
      if (!data.version) {
        data.version = '1.0';
        this.save(data);
      }
      if (!Array.isArray(data.animeList)) data.animeList = [];
      return data;
    } catch (e) {
      console.error('读取本地数据失败，已重置：', e);
      return { version: '1.0', animeList: [] };
    }
  },

  /** 序列化保存到 localStorage */
  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.error('保存数据失败：', e);
    }
  },

  /** 导出全部数据为 JSON 文件下载 */
  exportToFile() {
    const data = this.load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'anime_tracker_backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /** 读取用户选择的备份文件，返回 Promise<数据对象>（解析后自动写回 localStorage） */
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !Array.isArray(data.animeList)) {
            throw new Error('文件格式不正确');
          }
          if (!data.version) data.version = '1.0';
          this.save(data);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },

  /** 清空本地全部数据 */
  clearAll() {
    localStorage.removeItem(this.KEY);
  },
};
