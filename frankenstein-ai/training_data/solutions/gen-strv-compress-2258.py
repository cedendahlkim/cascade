# Task: gen-strv-compress-2258 | Score: 100% | 2026-02-13T18:57:48.459094

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))