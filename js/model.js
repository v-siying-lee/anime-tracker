/* js/model.js — 数据模型与状态流转 */

const AnimeModel = (function () {
  // 内存中的全量数据，启动时从 localStorage 加载
  let appData = AnimeStorage.load();

  /** 生成简单唯一 ID */
  function generateUUID() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /** 今天的日期，格式 YYYY-MM-DD */
  function getToday() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  return {
    getAll() {
      return appData.animeList;
    },

    getById(id) {
      return appData.animeList.find(a => a.id === id) || null;
    },

    /** 新增番剧：生成 uuid、初始化集数数组，插入列表开头 */
    add(animeObj) {
      const total = parseInt(animeObj.totalEpisodes, 10);
      const episodes = [];
      for (let i = 1; i <= total; i++) {
        episodes.push({ num: i, watched: false, date: null });
      }
      const anime = {
        id: generateUUID(),
        title: animeObj.title,
        cover: animeObj.cover || '',
        totalEpisodes: total,
        status: 'plan_to_watch',
        startDate: null,
        endDate: null,
        addedAt: new Date().toISOString(),
        episodes,
      };
      appData.animeList.unshift(anime);
      AnimeStorage.save(appData);
      return anime;
    },

    delete(id) {
      appData.animeList = appData.animeList.filter(a => a.id !== id);
      AnimeStorage.save(appData);
    },

    /**
     * 切换某一集的已看/未看状态，并驱动番剧整体状态自动流转：
     * 想看 -(首集已看)-> 在看 -(全部已看)-> 已看完 -(取消某集)-> 回退在看
     * @returns {{ anime: object, isCompleted: boolean }} isCompleted 表示本次操作触发了"全部看完"
     */
    toggleEpisode(animeId, episodeNum) {
      const anime = this.getById(animeId);
      if (!anime) throw new Error('番剧不存在');
      const ep = anime.episodes.find(e => e.num === episodeNum);
      if (!ep) throw new Error('集数不存在');

      let isCompleted = false;

      if (!ep.watched) {
        // 标记已看
        ep.watched = true;
        ep.date = getToday();
        if (anime.status === 'plan_to_watch') {
          anime.status = 'watching';
          anime.startDate = getToday();
        }
        if (anime.episodes.every(e => e.watched)) {
          anime.status = 'completed';
          anime.endDate = getToday();
          isCompleted = true;
        }
      } else {
        // 取消已看
        ep.watched = false;
        ep.date = null;
        if (anime.status === 'completed') {
          anime.status = 'watching';
          anime.endDate = null;
        }
      }

      AnimeStorage.save(appData);
      return { anime, isCompleted };
    },

    updateAnime(id, updates) {
      const anime = this.getById(id);
      if (!anime) return null;
      Object.assign(anime, updates);
      AnimeStorage.save(appData);
      return anime;
    },
  };
})();
