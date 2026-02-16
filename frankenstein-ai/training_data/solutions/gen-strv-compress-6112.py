# Task: gen-strv-compress-6112 | Score: 100% | 2026-02-13T14:55:49.197121

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))