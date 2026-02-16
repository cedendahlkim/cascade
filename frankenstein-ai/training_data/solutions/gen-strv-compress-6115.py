# Task: gen-strv-compress-6115 | Score: 100% | 2026-02-13T18:43:50.014765

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))