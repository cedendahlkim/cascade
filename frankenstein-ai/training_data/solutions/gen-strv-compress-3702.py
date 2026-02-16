# Task: gen-strv-compress-3702 | Score: 100% | 2026-02-13T19:47:46.252791

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))