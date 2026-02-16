# Task: gen-strv-compress-1155 | Score: 100% | 2026-02-15T10:27:55.270349

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))