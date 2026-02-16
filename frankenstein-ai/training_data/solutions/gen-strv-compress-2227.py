# Task: gen-strv-compress-2227 | Score: 100% | 2026-02-13T12:13:18.930713

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))