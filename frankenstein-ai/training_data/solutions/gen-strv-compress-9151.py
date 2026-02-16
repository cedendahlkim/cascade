# Task: gen-strv-compress-9151 | Score: 100% | 2026-02-13T10:13:39.787713

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))