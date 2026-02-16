# Task: gen-strv-compress-7797 | Score: 100% | 2026-02-13T18:33:51.080234

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))