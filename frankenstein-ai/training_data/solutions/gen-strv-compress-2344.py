# Task: gen-strv-compress-2344 | Score: 100% | 2026-02-13T21:08:25.540909

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))