# Task: gen-strv-compress-1709 | Score: 100% | 2026-02-13T18:19:31.919701

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))