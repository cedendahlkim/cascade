# Task: gen-strv-compress-4463 | Score: 100% | 2026-02-13T12:19:11.466243

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))