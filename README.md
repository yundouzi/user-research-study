# 岩中花述播客用户研究原型

这是一个用于播客信息组织与检索研究的静态交互原型。项目当前由原生 HTML、CSS 和 JavaScript 构成，无需安装依赖或执行构建步骤。

## 本地运行

参与者流程可直接打开 `index.html`，也可通过本地 HTTP 服务运行：

```powershell
python -m http.server 8000
```

然后访问 `http://127.0.0.1:8000/`。

如需在本地启用研究者视图，请将 `config.example.js` 复制为 `config.js`，再设置一个仅用于本地原型的访问值。`config.js` 已被 Git 忽略。不要使用真实密码或其他系统中复用的凭据。前端访问门槛不是真正的身份认证，不适合保护云端研究数据。

## 项目文档

- [研究背景与方法](RESEARCH_CONTEXT.md)
- [技术背景与运行说明](TECHNICAL_CONTEXT.md)
- [决策记录与后续工作](DECISIONS_AND_NEXT_STEPS.md)

## 数据与安全

当前原型只在浏览器 `localStorage` 中保存进度，并由使用者手动导出 CSV/JSON。仓库不应包含真实参与者数据、录屏文件、访问凭据或本地 `.env` / `config.js` 文件。正式云端研究需要服务端身份认证、数据隔离、加密存储及明确的数据保留和删除流程。
