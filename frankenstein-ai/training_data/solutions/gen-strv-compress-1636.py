# Task: gen-strv-compress-1636 | Score: 100% | 2026-02-13T17:35:54.394305

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))