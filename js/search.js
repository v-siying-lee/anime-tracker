/* js/search.js — 豆瓣搜索与添加番剧 */

const SearchModule = {
  /** 防抖函数 */
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  init() {
    const modal = document.getElementById('addModal');

    // 打开模态框
    document.getElementById('addAnimeBtn').addEventListener('click', () => {
      modal.classList.add('active');
      document.getElementById('searchInput').focus();
    });

    // 关闭：按钮 / 遮罩 / ESC
    const close = () => {
      modal.classList.remove('active');
      this._reset();
    };
    document.getElementById('closeModalBtn').addEventListener('click', close);
    document.getElementById('modalOverlay').addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

    // 搜索输入防抖 500ms
    document.getElementById('searchInput').addEventListener(
      'input',
      this.debounce(e => this.search(e.target.value.trim()), 500)
    );

    document.getElementById('confirmAddBtn').addEventListener('click', () => this.confirmAdd());
  },

  /** 调用本地代理搜索豆瓣 */
  search(keyword) {
    const container = document.getElementById('searchResults');
    if (!keyword) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = '<div class="search-hint">搜索中...</div>';

    fetch(`http://127.0.0.1:5000/api/douban/search?q=${encodeURIComponent(keyword)}`)
      .then(resp => {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(list => this.renderResults(list))
      .catch(err => {
        console.error('搜索失败：', err);
        container.innerHTML = '<div class="search-hint error">搜索失败，请确保代理已启动（python proxy.py）</div>';
      });
  },

  /** 渲染搜索结果列表 */
  renderResults(list) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = '<div class="search-hint">没有找到相关结果，可以直接在下方手动填写</div>';
      return;
    }

    list.forEach(item => {
      // 豆瓣接口返回的封面字段是 img（兼容 pic）；集数字段是 episode
      const coverUrl = item.img || item.pic || '';
      const el = document.createElement('div');
      el.className = 'search-item';
      el.innerHTML = `
        <img referrerpolicy="no-referrer" alt="">
        <div class="search-item-info">
          <div class="search-item-title">${Renderer._escape(item.title || '')}</div>
          <div class="search-item-meta">${Renderer._escape(item.year || '')} · ${Renderer._escape(item.type || '')}</div>
        </div>`;
      // 缩略图优先走本地图片代理（绕过防盗链），失败则回退为直连
      const imgEl = el.querySelector('img');
      if (coverUrl) {
        imgEl.src = `http://127.0.0.1:5000/api/douban/img?url=${encodeURIComponent(coverUrl)}`;
        imgEl.addEventListener('error', () => { imgEl.src = coverUrl; }, { once: true });
      }
      el.addEventListener('click', () => this.selectResult(item));
      container.appendChild(el);
    });
  },

  /** 选中某条搜索结果：回填表单并短暂高亮 */
  selectResult(item) {
    document.getElementById('formTitle').value = item.title || '';
    document.getElementById('formCover').value = item.img || item.pic || '';
    document.getElementById('formEpisodes').value = item.episodes_count || item.episode || item.episodes || '';

    ['formTitle', 'formCover', 'formEpisodes'].forEach(id => {
      const el = document.getElementById(id);
      el.classList.add('field-filled');
      setTimeout(() => el.classList.remove('field-filled'), 1500);
    });
  },

  /** 校验并添加 */
  confirmAdd() {
    const title = document.getElementById('formTitle').value.trim();
    const cover = document.getElementById('formCover').value.trim();
    const episodes = parseInt(document.getElementById('formEpisodes').value, 10);
    const errEl = document.getElementById('formError');

    if (!title) {
      errEl.textContent = '请填写番剧标题';
      return;
    }
    if (!Number.isInteger(episodes) || episodes <= 0) {
      errEl.textContent = '总集数必须为正整数';
      return;
    }
    errEl.textContent = '';

    const newAnime = AnimeModel.add({ title, cover, totalEpisodes: episodes });

    document.getElementById('addModal').classList.remove('active');
    this._reset();

    Renderer.renderAnimeList();
    App.setCurrentAnimeId(newAnime.id);
    Renderer.renderDetail(newAnime.id);
    Renderer.highlightAnimeCard(newAnime.id);
  },

  /** 清空搜索与表单 */
  _reset() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    ['formTitle', 'formCover', 'formEpisodes'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('formError').textContent = '';
  },
};
