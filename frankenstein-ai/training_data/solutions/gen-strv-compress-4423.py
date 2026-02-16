# Task: gen-strv-compress-4423 | Score: 100% | 2026-02-13T17:35:55.993499

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))