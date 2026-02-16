# Task: gen-strv-compress-4944 | Score: 100% | 2026-02-13T11:44:44.847777

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))