# -*- coding: utf-8 -*-
# proxy.py — 豆瓣搜索 / 图片代理服务
# 启动命令：python proxy.py
# 首次使用请先安装依赖：pip install flask flask-cors requests

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from urllib.parse import quote
import requests

app = Flask(__name__)
CORS(app)  # 允许所有来源跨域访问

# 豆瓣接口要求的请求头，缺 Referer 容易被拒绝
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://movie.douban.com/",
}


@app.route("/api/douban/search")
def douban_search():
    """转发豆瓣影视搜索建议接口，原样返回 JSON"""
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    try:
        url = f"https://movie.douban.com/j/subject_suggest?q={quote(q)}"
        resp = requests.get(url, headers=HEADERS, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        print(f"搜索请求失败：{e}")
        return jsonify({"error": "搜索失败"}), 503


@app.route("/api/douban/img")
def douban_img():
    """代理豆瓣图片，绕过防盗链，返回二进制与正确 Content-Type"""
    url = request.args.get("url", "").strip()
    if not url:
        return "Missing url", 400
    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "image/jpeg")
        return Response(resp.content, content_type=content_type)
    except Exception as e:
        print(f"图片请求失败：{e}")
        return "Not Found", 404


if __name__ == "__main__":
    print("豆瓣代理服务已启动：http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000)
