# Task: gen-strv-compress-7075 | Score: 100% | 2026-02-13T12:35:37.528426

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))