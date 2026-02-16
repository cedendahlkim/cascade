# Task: gen-strv-compress-9017 | Score: 100% | 2026-02-13T12:26:42.534133

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))