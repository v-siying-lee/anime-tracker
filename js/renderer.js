/* js/renderer.js — DOM 渲染 */

const Renderer = {
  // 状态 → 样式类与文案映射
  _statusMap: {
    watching: { cls: 'status-watching', text: '在看' },
    completed: { cls: 'status-completed', text: '已看完' },
    plan_to_watch: { cls: 'status-plan', text: '想看' },
  },

  /** 防止标题等文本注入 HTML */
  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  },

  /**
   * 给封面 img 设置图片源：优先走本地代理（绕过豆瓣防盗链），
   * 代理不可用时回退为直连，仍失败则执行最终回调（如显示占位图）
   */
  _setCoverSrc(imgEl, url, finalFallback) {
    if (!url) {
      if (finalFallback) finalFallback();
      return;
    }
    const proxyUrl = `http://127.0.0.1:5000/api/douban/img?url=${encodeURIComponent(url)}`;
    imgEl.addEventListener('error', () => {
      if (imgEl.dataset.stage === 'direct') {
        if (finalFallback) finalFallback(); // 直连也失败
      } else {
        imgEl.dataset.stage = 'direct';
        imgEl.src = url; // 代理失败 → 直连重试
      }
    });
    imgEl.src = proxyUrl;
  },

  /** 渲染左侧番剧卡片列表 */
  renderAnimeList() {
    const listEl = document.getElementById('animeList');
    listEl.innerHTML = '';

    AnimeModel.getAll().forEach(anime => {
      const watchedCount = anime.episodes.filter(e => e.watched).length;
      const percent = anime.totalEpisodes > 0 ? (watchedCount / anime.totalEpisodes) * 100 : 0;
      const s = this._statusMap[anime.status] || this._statusMap.plan_to_watch;

      const card = document.createElement('div');
      card.className = 'anime-card';
      card.dataset.id = anime.id;
      card.innerHTML = `
        <div class="card-cover-wrap">
          <img class="card-cover" referrerpolicy="no-referrer" alt="">
          <div class="card-cover-placeholder hidden">暂无封面</div>
        </div>
        <div class="card-info">
          <div class="card-title">${this._escape(anime.title)}</div>
          <div class="card-progress"><div class="card-progress-inner" style="width:${percent}%"></div></div>
          <span class="status-tag ${s.cls}">${s.text}</span>
        </div>`;

      // 封面：代理优先，直连兜底，最终失败显示占位块
      const img = card.querySelector('.card-cover');
      this._setCoverSrc(img, anime.cover, () => {
        img.classList.add('hidden');
        card.querySelector('.card-cover-placeholder').classList.remove('hidden');
      });

      // 点击卡片 → 渲染详情并高亮
      card.addEventListener('click', () => {
        App.setCurrentAnimeId(anime.id);
        this.renderDetail(anime.id);
        this.highlightAnimeCard(anime.id);
      });

      listEl.appendChild(card);
    });
  },

  /** 渲染右侧详情区（封面、进度、集数圆点、统计） */
  renderDetail(animeId) {
    const anime = AnimeModel.getById(animeId);
    if (!anime) return this.renderEmptyState();

    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('detailContent').classList.remove('hidden');

    const cover = document.getElementById('detailCover');
    cover.referrerPolicy = 'no-referrer';
    cover.dataset.stage = '';
    this._setCoverSrc(cover, anime.cover);
    document.getElementById('detailTitle').textContent = anime.title;

    // 生成集数圆点矩阵（flex-wrap 自然换行）
    const dotsEl = document.getElementById('episodeDots');
    dotsEl.innerHTML = '';
    anime.episodes.forEach(ep => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (ep.watched ? ' watched' : '');
      dot.dataset.episode = ep.num;
      if (ep.watched && ep.date) dot.dataset.date = ep.date;
      dot.textContent = ep.num;
      dotsEl.appendChild(dot);
    });

    // 进度文字、状态标签、统计信息
    this.updateProgress(animeId);

    // 绑定删除按钮
    document.getElementById('deleteAnimeBtn').onclick = () => {
      if (!confirm(`确定删除《${anime.title}》吗？此操作不可恢复。`)) return;
      AnimeModel.delete(animeId);
      App.setCurrentAnimeId(null);
      this.renderAnimeList();
      const remaining = AnimeModel.getAll();
      if (remaining.length > 0) {
        App.setCurrentAnimeId(remaining[0].id);
        this.renderDetail(remaining[0].id);
        this.highlightAnimeCard(remaining[0].id);
      } else {
        this.renderEmptyState();
      }
    };
  },

  /** 显示空状态，隐藏详情区 */
  renderEmptyState() {
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('detailContent').classList.add('hidden');
  },

  /** 局部刷新：进度文字、状态标签、统计区 */
  updateProgress(animeId) {
    const anime = AnimeModel.getById(animeId);
    if (!anime) return;

    const watched = anime.episodes.filter(e => e.watched).length;
    document.getElementById('detailProgress').textContent = `已看 ${watched} / ${anime.totalEpisodes} 集`;

    const s = this._statusMap[anime.status] || this._statusMap.plan_to_watch;
    const tag = document.getElementById('detailStatus');
    tag.className = 'status-tag ' + s.cls;
    tag.textContent = s.text;

    const stats = document.getElementById('detailStats');
    let html = '';
    if (anime.startDate) html += `<div>开始观看：${anime.startDate}</div>`;
    if (anime.endDate) html += `<div>看完日期：${anime.endDate}</div>`;
    if (anime.startDate && anime.endDate) {
      const days = Math.round((new Date(anime.endDate) - new Date(anime.startDate)) / 86400000) + 1;
      html += `<div>共观看：${days} 天</div>`;
    }
    stats.innerHTML = html;
  },

  /** 高亮指定卡片，移除其他卡片的 active */
  highlightAnimeCard(animeId) {
    document.querySelectorAll('.anime-card').forEach(c => {
      c.classList.toggle('active', c.dataset.id === animeId);
    });
  },
};
