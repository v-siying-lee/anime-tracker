/* js/interaction.js — 点击交互、涟漪、Tooltip、庆祝动画 */

const Interaction = {
  _celebrateTimer: null,

  initEpisodeClicks() {
    const container = document.getElementById('episodeDots');

    // 事件委托：点击集数圆点
    container.addEventListener('click', e => {
      const dot = e.target.closest('.dot');
      if (!dot) return;
      const animeId = App.getCurrentAnimeId();
      if (!animeId) return;

      const episodeNum = parseInt(dot.dataset.episode, 10);
      try {
        const { anime, isCompleted } = AnimeModel.toggleEpisode(animeId, episodeNum);

        // 同步圆点外观
        const ep = anime.episodes.find(x => x.num === episodeNum);
        dot.classList.toggle('watched', ep.watched);
        if (ep.watched) dot.dataset.date = ep.date;
        else delete dot.dataset.date;

        // 局部刷新详情 + 重建左侧列表（更新卡片进度条）并保持选中高亮
        Renderer.updateProgress(anime.id);
        Renderer.renderAnimeList();
        Renderer.highlightAnimeCard(animeId);

        // 涟漪动画
        this._ripple(dot);

        if (isCompleted) this.celebrateCompletion(anime);
      } catch (err) {
        console.error('切换集数状态失败：', err);
      }
    });

    // 事件委托：悬停已看圆点显示观看日期 tooltip
    container.addEventListener('mouseover', e => {
      const dot = e.target.closest('.dot.watched');
      if (dot && dot.dataset.date) this.showTooltip(dot, dot.dataset.date);
    });
    container.addEventListener('mouseout', e => {
      if (e.target.closest('.dot')) this._removeTooltip();
    });

    // 庆祝弹窗：手动关闭（按钮 / 遮罩）
    document.getElementById('closeCompletionBtn').addEventListener('click', () => {
      document.getElementById('completionModal').classList.remove('active');
    });
    document.querySelector('#completionModal .modal-overlay').addEventListener('click', () => {
      document.getElementById('completionModal').classList.remove('active');
    });
  },

  /** 在圆点中心生成涟漪，动画结束后移除 */
  _ripple(dot) {
    const rect = dot.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.left = rect.width / 2 + 'px';
    span.style.top = rect.height / 2 + 'px';
    dot.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  },

  /** 在圆点上方显示"观看于：YYYY-MM-DD"提示（fixed 定位避免被 overflow 裁剪） */
  showTooltip(dot, dateStr) {
    this._removeTooltip();
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.textContent = `观看于：${dateStr}`;
    document.body.appendChild(tip);

    const rect = dot.getBoundingClientRect();
    tip.style.left = rect.left + rect.width / 2 - tip.offsetWidth / 2 + 'px';
    tip.style.top = rect.top - tip.offsetHeight - 8 + 'px';
  },

  _removeTooltip() {
    document.querySelectorAll('.tooltip').forEach(t => t.remove());
  },

  /** 全部看完：弹出庆祝弹窗 + Confetti 彩带 */
  celebrateCompletion(anime) {
    const modal = document.getElementById('completionModal');
    const info = document.getElementById('completionInfo');

    let daysText = '';
    if (anime.startDate && anime.endDate) {
      const days = Math.round((new Date(anime.endDate) - new Date(anime.startDate)) / 86400000) + 1;
      daysText = `<p>共观看 ${days} 天（${anime.startDate} ~ ${anime.endDate}）</p>`;
    }
    info.innerHTML = `<p class="completion-anime">《${Renderer._escape(anime.title)}》</p>${daysText}`;

    modal.classList.add('active');
    this._confetti();

    // 5 秒后自动关闭弹窗
    clearTimeout(this._celebrateTimer);
    this._celebrateTimer = setTimeout(() => modal.classList.remove('active'), 5000);
  },

  /** 生成 50-80 个随机彩带从顶部飘落，动画结束后清理 DOM */
  _confetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd166', '#06d6a0'];
    const count = 50 + Math.floor(Math.random() * 31);

    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = (2 + Math.random() * 2) + 's'; // 2-4s 随机下落
      document.body.appendChild(c);
    }

    // 最长动画 4s 结束后统一清理
    setTimeout(() => {
      document.querySelectorAll('.confetti').forEach(c => c.remove());
    }, 4500);
  },
};
