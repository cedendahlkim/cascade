# Task: gen-strv-compress-6785 | Score: 100% | 2026-02-13T18:28:41.746111

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))