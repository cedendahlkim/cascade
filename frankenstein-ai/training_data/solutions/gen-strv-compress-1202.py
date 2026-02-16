# Task: gen-strv-compress-1202 | Score: 100% | 2026-02-13T18:29:06.120571

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))