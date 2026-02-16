# Task: gen-strv-compress-9362 | Score: 100% | 2026-02-15T08:48:27.149237

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))