# Task: gen-strv-compress-5642 | Score: 100% | 2026-02-13T09:51:24.004753

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))