# Task: gen-strv-compress-5276 | Score: 100% | 2026-02-13T18:37:38.421940

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))