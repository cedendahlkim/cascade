# Task: gen-strv-compress-9698 | Score: 100% | 2026-02-13T18:50:28.408523

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))