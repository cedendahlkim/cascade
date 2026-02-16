# Task: gen-strv-compress-4274 | Score: 100% | 2026-02-13T15:46:18.714473

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))