# Task: gen-strv-compress-1938 | Score: 100% | 2026-02-13T09:17:03.004781

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))