# Task: gen-strv-compress-8038 | Score: 100% | 2026-02-14T12:04:23.178585

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))