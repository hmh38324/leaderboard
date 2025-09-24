// 排行榜页面JavaScript

// 游戏配置
const GAMES = {
    1: { name: '拼速达人', icon: '⚡', description: '守擂挑战' },
    2: { name: '碰碰乐', icon: '🚗', description: '遥控对战' },
    3: { name: '沙包投掷', icon: '🎯', description: '精准投掷' },
    4: { name: '巧手取棒', icon: '🥢', description: '精准抓取' }
};

// API 基础 URL
const API_BASE = 'https://addscoreapi.biboran.top/api';

// 全局变量
let allScores = [];
let currentGameFilter = 'all';
let leaderboardData = [];

// DOM 元素
const loading = document.getElementById('loading');
const message = document.getElementById('message');
const totalParticipants = document.getElementById('totalParticipants');
const totalSubmissions = document.getElementById('totalSubmissions');
const totalScore = document.getElementById('totalScore');
const leaderboardTitle = document.getElementById('leaderboardTitle');
const leaderboardCount = document.getElementById('leaderboardCount');
const leaderboardList = document.getElementById('leaderboardList');
const emptyState = document.getElementById('emptyState');
const gameDetailModal = document.getElementById('gameDetailModal');
const gameDetailTitle = document.getElementById('gameDetailTitle');
const gameStats = document.getElementById('gameStats');
const recentScores = document.getElementById('recentScores');
// 设置相关元素
const settingsModal = document.getElementById('settingsModal');
const settingsAuth = document.getElementById('settingsAuth');
const settingsPanel = document.getElementById('settingsPanel');
const settingsPasswordInput = document.getElementById('settingsPassword');
const trialLockedToggleEl = document.getElementById('trialLockedToggle');
const arenaLockedToggleEl = document.getElementById('arenaLockedToggle');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadLeaderboardData();
    fetchFlagsAndApply();
});

// 设置事件监听器
function setupEventListeners() {
    // 游戏选择器
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const gameId = this.dataset.game;
            selectGame(gameId);
        });
    });

    // 关闭游戏详情弹窗
    gameDetailModal.addEventListener('click', function(e) {
        if (e.target === gameDetailModal) {
            closeGameDetail();
        }
    });

    // ESC 键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeGameDetail();
        }
    });
}

// 选择游戏
function selectGame(gameId) {
    // 更新标签状态
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-game="${gameId}"]`).classList.add('active');

    currentGameFilter = gameId;
    updateLeaderboard();
}

// 加载排行榜数据
async function loadLeaderboardData() {
    showLoading(true);
    
    try {
        // 获取所有积分记录
        const response = await fetch(`${API_BASE}/scores`);
        if (!response.ok) {
            throw new Error('加载数据失败');
        }
        
        const result = await response.json();
        if (result.success && result.data) {
            allScores = result.data;
            processLeaderboardData();
            updateLeaderboard();
            updateStats();
        } else {
            throw new Error('数据格式错误');
        }
        
    } catch (error) {
        console.error('加载排行榜数据失败:', error);
        showMessage('加载数据失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 处理排行榜数据
function processLeaderboardData() {
    const playerScores = {};
    
    // 按员工分组计算总分
    allScores.forEach(score => {
        const key = `${score.employee_id}_${score.employee_name}`;
        if (!playerScores[key]) {
            playerScores[key] = {
                employeeId: score.employee_id,
                employeeName: score.employee_name,
                totalScore: 0,
                gameScores: {},
                lastPlayTime: null
            };
        }
        
        playerScores[key].totalScore += score.score;
        playerScores[key].gameScores[score.game_id] = (playerScores[key].gameScores[score.game_id] || 0) + score.score;
        
        const playTime = new Date(score.created_at);
        if (!playerScores[key].lastPlayTime || playTime > playerScores[key].lastPlayTime) {
            playerScores[key].lastPlayTime = playTime;
        }
    });
    
    // 转换为数组并排序
    leaderboardData = Object.values(playerScores).sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
        }
        // 总分相同时按最后游戏时间排序
        return b.lastPlayTime - a.lastPlayTime;
    });
}

// 更新排行榜显示
function updateLeaderboard() {
    let filteredData = leaderboardData;
    let title = '全部游戏排行榜';
    
    if (currentGameFilter !== 'all') {
        const gameId = parseInt(currentGameFilter);
        const game = GAMES[gameId];
        title = `${game.icon} ${game.name} 排行榜`;
        
        // 过滤只显示有该游戏积分的玩家
        filteredData = leaderboardData.filter(player => 
            player.gameScores[gameId] && player.gameScores[gameId] > 0
        );
        
        // 按该游戏积分排序
        filteredData.sort((a, b) => {
            const scoreA = a.gameScores[gameId] || 0;
            const scoreB = b.gameScores[gameId] || 0;
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
            return b.lastPlayTime - a.lastPlayTime;
        });
    }
    
    leaderboardTitle.textContent = title;
    leaderboardCount.textContent = `${filteredData.length} 人参与`;
    
    if (filteredData.length === 0) {
        leaderboardList.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        displayLeaderboard(filteredData);
    }
}

// 显示排行榜
function displayLeaderboard(data) {
    leaderboardList.innerHTML = data.map((player, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        let gameScoresHtml = '';
        if (currentGameFilter === 'all') {
            // 显示所有游戏的积分
            Object.keys(player.gameScores).forEach(gameId => {
                const game = GAMES[gameId];
                const score = player.gameScores[gameId];
                if (score > 0) {
                    gameScoresHtml += `
                        <div class="game-score">
                            ${game.icon} ${score}
                        </div>
                    `;
                }
            });
        } else {
            // 显示当前游戏的积分
            const gameId = parseInt(currentGameFilter);
            const game = GAMES[gameId];
            const score = player.gameScores[gameId] || 0;
            gameScoresHtml = `
                <div class="game-score">
                    ${game.icon} ${score}
                </div>
            `;
        }
        
        const displayScore = currentGameFilter === 'all' 
            ? player.totalScore 
            : (player.gameScores[parseInt(currentGameFilter)] || 0);
        
        return `
            <div class="leaderboard-item ${rankClass}" onclick="showPlayerDetail('${player.employeeId}', '${player.employeeName}')">
                <div class="rank-number">${rank}</div>
                <div class="player-info">
                    <h3 class="player-name">${player.employeeName}</h3>
                    <p class="player-id">工号: ${player.employeeId}</p>
                </div>
                <div class="score-info">
                    <div class="total-score">${displayScore}</div>
                    <div class="game-scores">${gameScoresHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 更新统计信息
function updateStats() {
    const totalPlayers = leaderboardData.length;
    const totalSubmissionsCount = allScores.length;
    const totalScoreSum = allScores.reduce((sum, score) => sum + score.score, 0);
    
    totalParticipants.textContent = totalPlayers;
    totalSubmissions.textContent = totalSubmissionsCount;
    totalScore.textContent = totalScoreSum;
}

// 显示玩家详情
function showPlayerDetail(employeeId, employeeName) {
    const player = leaderboardData.find(p => p.employeeId === employeeId);
    if (!player) return;
    
    gameDetailTitle.textContent = `${employeeName} (${employeeId}) 的游戏详情`;
    
    // 显示游戏统计
    const gameStatsHtml = Object.keys(player.gameScores).map(gameId => {
        const game = GAMES[gameId];
        const score = player.gameScores[gameId];
        return `
            <div class="game-stat-item">
                <div class="game-stat-number">${score}</div>
                <p class="game-stat-label">${game.icon} ${game.name}</p>
            </div>
        `;
    }).join('');
    
    gameStats.innerHTML = gameStatsHtml;
    
    // 显示最近积分记录
    const playerScores = allScores
        .filter(score => score.employee_id === employeeId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
    
    const recentScoresHtml = playerScores.map(score => {
        const game = GAMES[score.game_id];
        const time = new Date(score.created_at).toLocaleString('zh-CN');
        return `
            <div class="recent-score-item">
                <div class="recent-score-info">
                    <div class="recent-score-name">${game.icon} ${game.name}</div>
                    <div class="recent-score-time">${time}</div>
                </div>
                <div class="recent-score-value">+${score.score}</div>
            </div>
        `;
    }).join('');
    
    recentScores.innerHTML = `
        <h3>最近积分记录</h3>
        ${recentScoresHtml || '<p style="color: #666; text-align: center;">暂无记录</p>'}
    `;
    
    gameDetailModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭游戏详情
function closeGameDetail() {
    gameDetailModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 刷新排行榜
function refreshLeaderboard() {
    loadLeaderboardData();
}

// 显示加载状态
function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// 显示消息
function showMessage(text, type = 'success') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.classList.remove('hidden');
    
    setTimeout(() => {
        message.classList.add('hidden');
    }, 3000);
}

// 自动刷新（每30秒）
setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadLeaderboardData();
    }
}, 30000);

// 导出总排行榜（CSV）
function exportTotalLeaderboard() {
    const password = prompt('请输入导出密码');
    if (password === null) {
        return;
    }
    if (password !== '1314520') {
        showMessage('密码错误，无法导出', 'error');
        return;
    }

    if (!leaderboardData || leaderboardData.length === 0) {
        showMessage('暂无数据可导出', 'error');
        return;
    }

    // 构建表头
    const headers = ['排名', '工号', '姓名', '总分', '拼速达人', '碰碰乐', '沙包投掷', '巧手取棒', '最后游戏时间'];

    // 确保以总分排序（与总榜一致）
    const data = [...leaderboardData].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.lastPlayTime - a.lastPlayTime;
    });

    // 转换为CSV
    const rows = data.map((player, index) => {
        const game1 = player.gameScores[1] || 0;
        const game2 = player.gameScores[2] || 0;
        const game3 = player.gameScores[3] || 0;
        const game4 = player.gameScores[4] || 0;
        const time = player.lastPlayTime ? new Date(player.lastPlayTime).toLocaleString('zh-CN') : '';
        const row = [
            index + 1,
            player.employeeId,
            player.employeeName,
            player.totalScore,
            game1,
            game2,
            game3,
            game4,
            time
        ];
        return row.map(v => {
            const s = String(v).replace(/"/g, '""');
            if (/[",\n]/.test(s)) {
                return `"${s}` + '"';
            }
            return s;
        }).join(',');
    });

    const csvContent = ['\ufeff' + headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const ts = new Date();
    const tsStr = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}`;
    a.href = url;
    a.download = `总排行榜_${tsStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('导出成功，已开始下载');
}

// 兼容某些环境的全局作用域限制
if (typeof window !== 'undefined') {
    window.exportTotalLeaderboard = exportTotalLeaderboard;
}

// 设置面板逻辑
function openSettings() {
    // 每次打开都要求输入密码
    if (settingsAuth) settingsAuth.classList.remove('hidden');
    if (settingsPanel) settingsPanel.classList.add('hidden');
    if (settingsPasswordInput) settingsPasswordInput.value = '';
    if (settingsModal) settingsModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    if (settingsModal) settingsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function verifySettingsPassword() {
    const val = (settingsPasswordInput && settingsPasswordInput.value) || '';
    if (val === '1314520') {
        if (settingsAuth) settingsAuth.classList.add('hidden');
        if (settingsPanel) settingsPanel.classList.remove('hidden');
        // 同步服务端锁定状态到开关
        fetchFlagsAndApply();
        showMessage('设置已解锁');
    } else {
        showMessage('密码错误', 'error');
    }
}

async function toggleTrialLocked(locked) {
    await updateFlags({ trialLocked: locked });
}

async function toggleArenaLocked(locked) {
    await updateFlags({ arenaLocked: locked });
}

if (typeof window !== 'undefined') {
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.verifySettingsPassword = verifySettingsPassword;
    window.toggleTrialLocked = toggleTrialLocked;
    window.toggleArenaLocked = toggleArenaLocked;
}

// 从服务端获取锁状态并应用到界面
async function fetchFlagsAndApply() {
    try {
        const res = await fetch('/api/flags');
        const json = await res.json();
        if (json && json.success && json.data) {
            const { trialLocked, arenaLocked } = json.data;
            if (trialLockedToggleEl) trialLockedToggleEl.checked = !!trialLocked;
            if (arenaLockedToggleEl) arenaLockedToggleEl.checked = !!arenaLocked;
            // 如需根据锁状态隐藏或禁用页面元素，可在此处理
        }
    } catch (e) {
        console.error('获取锁状态失败', e);
    }
}

// 更新服务端锁状态
async function updateFlags(partial) {
    try {
        const current = await (async () => {
            try {
                const r = await fetch('/api/flags');
                const j = await r.json();
                return (j && j.success && j.data) ? j.data : { trialLocked: false, arenaLocked: false };
            } catch { return { trialLocked: false, arenaLocked: false }; }
        })();
        const next = { ...current, ...partial };
        const res = await fetch('/api/flags', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...next, password: '1314520' })
        });
        const json = await res.json();
        if (json && json.success) {
            if (trialLockedToggleEl) trialLockedToggleEl.checked = !!json.data.trialLocked;
            if (arenaLockedToggleEl) arenaLockedToggleEl.checked = !!json.data.arenaLocked;
            showMessage('设置已更新');
        } else {
            showMessage('更新失败', 'error');
        }
    } catch (e) {
        console.error('更新锁状态失败', e);
        showMessage('网络错误，更新失败', 'error');
    }
}
