# Task: gen-strv-compress-7416 | Score: 100% | 2026-02-13T09:19:35.420628

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))