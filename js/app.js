/* js/app.js — 应用入口与初始化 */

const App = {
  currentAnimeId: null,

  setCurrentAnimeId(id) {
    this.currentAnimeId = id;
  },

  getCurrentAnimeId() {
    return this.currentAnimeId;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. 加载本地数据
  AnimeStorage.load();

  // 2. 渲染番剧列表
  Renderer.renderAnimeList();

  // 3. 列表非空：默认选中第一部；4. 列表为空：创建示例数据引导用户
  const list = AnimeModel.getAll();
  if (list.length > 0) {
    App.setCurrentAnimeId(list[0].id);
    Renderer.renderDetail(list[0].id);
    Renderer.highlightAnimeCard(list[0].id);
  } else {
    const sample = AnimeModel.add({
      title: '示例：点击圆点记录进度',
      cover: 'https://via.placeholder.com/300x400/667eea/ffffff?text=Anime',
      totalEpisodes: 12,
    });
    Renderer.renderAnimeList();
    App.setCurrentAnimeId(sample.id);
    Renderer.renderDetail(sample.id);
    Renderer.highlightAnimeCard(sample.id);
  }

  // 5. 搜索模块；6. 集数交互模块
  SearchModule.init();
  Interaction.initEpisodeClicks();

  // 7. 导出数据
  document.getElementById('exportBtn').addEventListener('click', () => {
    AnimeStorage.exportToFile();
  });

  // 8. 导入数据：点击按钮触发隐藏的文件选择框，导入成功后刷新页面
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('importFileInput');
  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    AnimeStorage.importFromFile(file)
      .then(() => location.reload())
      .catch(err => alert('导入失败：' + err.message));
    fileInput.value = ''; // 允许重复选择同一文件
  });

  // 9. 代理健康检查：失败时在导航栏提示，但不阻断手动添加等其他功能
  fetch('http://127.0.0.1:5000/api/douban/search?q=test')
    .then(resp => {
      if (!resp.ok) throw new Error('proxy error');
    })
    .catch(() => {
      const tip = document.createElement('span');
      tip.id = 'proxyStatus';
      tip.textContent = '⚠️ 代理未启动';
      document.querySelector('.nav-right').prepend(tip);
    });

  // 10. 移动端：切换左侧列表抽屉
  document.getElementById('toggleListBtn').addEventListener('click', () => {
    document.getElementById('animeList').classList.toggle('open');
  });
});
