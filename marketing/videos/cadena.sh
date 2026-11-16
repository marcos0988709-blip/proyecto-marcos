#!/bin/bash
# espera a que termine la tanda 4 y luego hace la 5 y la 6 (dos procesos en paralelo cada una)
cd "$(dirname "$0")"
until [ $(cat out/lote_t4a.log out/lote_t4b.log | grep -c "s →") -ge 10 ]; do sleep 20; done
for t in 5 6; do
  ids=$(python3 -c "import json;print(' '.join(v['id'] for v in json.load(open('guiones_t$t.json'))['videos']))"); set -- $ids
  ./lote.sh guiones_t$t.json 887$t $1 $2 $3 $4 $5 > out/lote_t${t}a.log 2>&1 &
  ./lote.sh guiones_t$t.json 888$t $6 $7 $8 $9 ${10} > out/lote_t${t}b.log 2>&1 &
  wait
  echo "TANDA $t LISTA"
done
