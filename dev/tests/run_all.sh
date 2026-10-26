#!/bin/sh
# 使い方：プロジェクトのルートで sh dev/tests/run_all.sh
# （Python3 と Playwright が必要です。node も使います）
cd "$(dirname "$0")/../.." || exit 1
python3 -m http.server 8765 >/dev/null 2>&1 &
SERVER=$!
sleep 1
echo "== 学習機能（v0.3 からの回帰テスト） =="; python3 dev/tests/test_learning.py 2>&1 | grep -E "FAIL|passed|errors"
echo "== カード詳細からの戻り =="; python3 dev/tests/test_return.py
echo "== v0.4 追加分 =="; python3 dev/tests/test_v04.py
kill $SERVER
