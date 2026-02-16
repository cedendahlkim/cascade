# Task: gen-strv-compress-8344 | Score: 100% | 2026-02-13T09:19:34.580005

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))