# Task: gen-strv-compress-6365 | Score: 100% | 2026-02-13T18:33:48.894576

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))