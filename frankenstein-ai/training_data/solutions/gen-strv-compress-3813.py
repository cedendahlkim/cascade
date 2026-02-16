# Task: gen-strv-compress-3813 | Score: 100% | 2026-02-13T20:33:08.718280

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))