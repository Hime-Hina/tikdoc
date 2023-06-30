# TikDoc

## 简介

一个简易的文档检索WEB应用，支持PDF、DOCX格式的文档的关键字检索。
前端选择服务器上的文档，输入关键字后查询，显示包含关键字文档所在页码和行号。

技术栈：Nuxt3 + Vue3 + Node.js + PostgreSQL

## 部署

首先在PostgreSQL中导入`server/database/tikdoc.sql`文件，
然后参照`.env.example`文件创建`.env`文件，填入数据库的连接信息。

然后执行以下命令构建并运行：

```bash
pnpm install
pnpm build
pnpm start
```

## TODO

- [ ] 重构、优化代码
- [ ] 支持更多格式的文档
- [ ] 文档的上传
- [ ] 使用OCR识别图片中的文本
- [ ] 语义搜索
- [ ] 使用Elasticsearch？
