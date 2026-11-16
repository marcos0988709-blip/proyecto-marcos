#!/bin/bash
# lote.sh guiones.json puerto ids...
G=$1; P=$2; shift 2
for id in "$@"; do PORT=$P python3 tanda.py $G $id; done
