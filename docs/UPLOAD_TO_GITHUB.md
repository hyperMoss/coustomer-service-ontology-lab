# 发布到 GitHub / Publishing

仓库名建议：`customer-service-ontology-lab`；建议先设为 **Private**，确认不包含敏感资料后再考虑公开。

1. 打开 https://github.com/new ，Owner 选 `hyperMoss`，Repository name 填 `customer-service-ontology-lab`。
2. 选择 `Private`。**不要**勾选 Initialize with README / Add .gitignore / Choose a license（项目自带）。
3. 解压本课程项目 ZIP 并打开对应目录，执行：

```bash
git init -b main
git add .
git commit -m "feat: add customer service ontology learning lab"
git remote add origin https://github.com/hyperMoss/customer-service-ontology-lab.git
git push -u origin main
```

如果本机已有 `gh` 且已完成 `gh auth login`，也可以直接在项目目录里执行：

```bash
gh repo create hyperMoss/customer-service-ontology-lab --private --source=. --remote=origin --push
```

若完成新建空仓库但不想在本机用命令行上传，把 GitHub 仓库地址发回聊天；已连接的 GitHub 工具可以将文本源码逐个提交到该仓库。

## 静态课程发布

在仓库 Settings → Pages 中选择 GitHub Actions 作为发布源，然后手动运行或推送 `.github/workflows/pages.yml`。若账户方案不支持私有仓库的 Pages，可改用本地静态服务器或在审查后调整可见性。
