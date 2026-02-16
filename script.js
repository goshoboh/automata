
const CONFIG = {
    GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxHdCz8ypy_aBeYztPDif1VJ2flyla_zMtWxvvrNSwCuWGD6oxuYaaBEB6TAEByVEvMMw/exec', // ここにGASのURLを貼り付け
    MOCK_MODE: false // false：本番稼働時　true：テスト動作確認
};

// DOM要素の取得
const dom = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('error-message'),
    content: document.getElementById('content'),
    player: document.getElementById('youtube-player'),
    title: document.getElementById('video-title'),
    description: document.getElementById('video-description')
};

/**
 * URLパラメータ 'v' (Video ID) を取得
 */
function getVideoIdFromParams() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v');
}

/**
 * 画面状態の切り替え
 */
function setView(viewName) {
    ['loading', 'error', 'content'].forEach(id => {
        dom[id].classList.add('hidden');
    });
    if (dom[viewName]) {
        dom[viewName].classList.remove('hidden');
    }
}

/**
 * モックデータの取得（テスト用）
 */
function getMockData(videoId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (videoId === 'invalid') {
                resolve({ success: false, message: 'URLが無効、または非公開です' });
            } else {
                resolve({
                    success: true,
                    data: {
                        title: "【サンプル】美しい自然の風景",
                        videoId: videoId || "dQw4w9WgXcQ", // デフォルト：Rick Roll (安全なサンプルとして)
                        description: "これはモックモードでの表示テストです。\nGASと連携すると、スプレッドシートの内容がここに表示されます。\n\n行の改行も\nこのように反映されます。"
                    }
                });
            }
        }, 1500); // 1.5秒の読み込み遅延演出
    });
}

/**
 * メイン処理
 */
async function init() {
    // 1. パラメータ確認
    const videoId = getVideoIdFromParams();

    // パラメータが無い場合
    if (!videoId) {
        setView('error');
        return;
    }

    // 2. データ取得
    try {
        let result;

        if (CONFIG.MOCK_MODE) {
            console.log("Mock Mode: Loading test data...");
            result = await getMockData(videoId);
        } else {
            // GAS APIへのリクエスト
            // URLパラメータとして videoId を送信
            const response = await fetch(`${CONFIG.GAS_WEB_APP_URL}?v=${videoId}`);
            const json = await response.json();
            result = json;
        }

        // 3. 結果の判定と表示
        if (result.success && result.data) {
            // YouTube埋め込みURLの構築
            // rel=0: 関連動画非表示
            // autoplay=1: 自動再生 (ブラウザポリシーによりミュートが必要な場合が多い)
            // controls=1: コントロール表示 (ユーザーの要望により戻す)
            // loop=1: ループ再生 (playlistパラメータが必須)
            // mute=1: 自動再生を確実にするためミュート
            const embedUrl = `https://www.youtube.com/embed/${result.data.videoId}?rel=0&autoplay=1&controls=1&loop=1&playlist=${result.data.videoId}&mute=1`;

            dom.player.src = embedUrl;
            dom.title.textContent = result.data.title;
            dom.description.textContent = result.data.description;

            setView('content');
        } else {
            // "無効"として返す場合 (success: false)
            dom.errorMessage.textContent = result.message || "動画が見つかりません";
            setView('error');
        }

    } catch (e) {
        console.error(e);
        dom.errorMessage.textContent = "通信エラーが発生しました";
        setView('error');
    }
}

// アプリケーション開始
init();
