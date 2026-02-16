# Task: gen-strv-compress-7877 | Score: 100% | 2026-02-13T21:49:10.381686

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))