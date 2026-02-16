# Task: gen-strv-compress-8213 | Score: 100% | 2026-02-13T18:36:05.317992

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))