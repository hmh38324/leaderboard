## 全局“上锁/解锁”功能实现说明（Cloudflare Pages + KV）

目标：一处开关，所有用户统一生效（非本地 localStorage）。示例开关：试炼场上锁、竞技场上锁。

### 1. KV 绑定（服务端存储）

wrangler.toml 增加 KV 绑定（本项目已配置）：

```toml
[[kv_namespaces]]
binding = "FLAGS_KV"
id = "<你的KV命名空间ID>"
```

> 本项目绑定的示例：`FLAGS_KV` → `84c5184976714d31a7c5d131f0350444`

### 2. Pages Functions 接口（/api/flags）

文件：`functions/api/flags.js`

```js
const DEFAULT_FLAGS = { trialLocked: false, arenaLocked: false };

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function onRequestGet({ env }) {
  const raw = await env.FLAGS_KV.get('flags');
  const flags = raw ? JSON.parse(raw) : DEFAULT_FLAGS;
  return jsonResponse({ success: true, data: flags });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  if ((body?.password) !== '1314520') {
    return jsonResponse({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const next = {
    trialLocked: Boolean(body?.trialLocked),
    arenaLocked: Boolean(body?.arenaLocked),
  };
  await env.FLAGS_KV.put('flags', JSON.stringify(next));
  return jsonResponse({ success: true, data: next });
}
```

### 3. 前端集成示例

初始化时读取状态：

```js
async function fetchFlagsAndApply() {
  const res = await fetch('/api/flags');
  const json = await res.json();
  if (json?.success) {
    const { trialLocked, arenaLocked } = json.data;
    // TODO: 根据锁状态禁用入口/隐藏按钮/显示提示
  }
}
```

更新状态（需管理密码）：

```js
async function updateFlags(partial) {
  const cur = await fetch('/api/flags').then(r => r.json()).then(j => j?.data || {});
  const next = { ...cur, ...partial };
  const res = await fetch('/api/flags', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...next, password: '1314520' }),
  }).then(r => r.json());
  if (!res?.success) throw new Error('更新失败');
}
```

UI 联动（示例）：

```js
function applyLockToUI(flags) {
  const { trialLocked, arenaLocked } = flags;
  document.querySelector('#trialButton')?.toggleAttribute('disabled', !!trialLocked);
  document.querySelector('#arenaButton')?.toggleAttribute('disabled', !!arenaLocked);
}
```

### 4. 接口自测

读取：

```bash
curl -s https://<你的域名>/api/flags | jq
```

更新（示例：上锁试炼场、解锁竞技场）：

```bash
curl -s -X POST https://<你的域名>/api/flags \
  -H 'content-type: application/json' \
  -d '{"trialLocked":true, "arenaLocked":false, "password":"1314520"}' | jq
```

### 5. 部署与缓存

- 更新 wrangler.toml 或 Functions 后，需要重新部署 Pages。
- 前端脚本建议加版本号参数（例如 `script.js?v=时间戳`）以避免缓存。

### 6. 安全建议（可选增强）

- 将管理密码改为 Pages Secret：
  - `wrangler pages secret put ADMIN_PASSWORD`
  - 代码读取 `env.ADMIN_PASSWORD` 替代常量。
- 或改用签名/令牌校验方式。

### 7. 迁移到其它项目的步骤速记

1) 在 Cloudflare 新建 KV 命名空间，记录其 ID。
2) 将 `functions/api/flags.js` 拷贝到新项目。
3) 在新项目 `wrangler.toml` 添加：

```toml
[[kv_namespaces]]
binding = "FLAGS_KV"
id = "<KV命名空间ID>"
```

4) 前端加入 `fetch('/api/flags')` 初始化与 `updateFlags()` 更新逻辑。
5) 根据锁状态联动 UI（隐藏/禁用/提示）。
6) 部署并验证。


