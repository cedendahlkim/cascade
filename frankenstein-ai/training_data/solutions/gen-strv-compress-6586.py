# Task: gen-strv-compress-6586 | Score: 100% | 2026-02-13T21:49:33.974538

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))