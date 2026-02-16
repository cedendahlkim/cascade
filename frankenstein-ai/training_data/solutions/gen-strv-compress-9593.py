# Task: gen-strv-compress-9593 | Score: 100% | 2026-02-13T18:50:26.198968

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))