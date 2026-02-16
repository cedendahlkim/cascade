# Task: gen-strv-compress-2653 | Score: 100% | 2026-02-13T16:47:55.224333

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))