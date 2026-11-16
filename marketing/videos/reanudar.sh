#!/bin/bash
# Reanuda las tandas 5-9: solo hace los vídeos que faltan en out/final (dos procesos en paralelo)
cd "$(dirname "$0")"
for t in 5 6 7 8 9; do
  ids=$(python3 -c "import json,os;print(' '.join(v['id'] for v in json.load(open('guiones_t$t.json'))['videos'] if not os.path.exists('out/final/'+v['id']+'.mp4')))")
  set -- $ids; n=$#; h=$(( (n+1)/2 ))
  [ $n -gt 0 ] && ./lote.sh guiones_t$t.json 890$t ${@:1:$h} > out/lote_r${t}a.log 2>&1 &
  [ $n -gt $h ] && ./lote.sh guiones_t$t.json 891$t ${@:$((h+1))} > out/lote_r${t}b.log 2>&1 &
  wait; echo "TANDA $t LISTA"
done
