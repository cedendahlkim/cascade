# Task: gen-strv-compress-4445 | Score: 100% | 2026-02-13T09:12:19.895136

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))