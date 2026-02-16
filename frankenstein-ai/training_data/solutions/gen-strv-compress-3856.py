# Task: gen-strv-compress-3856 | Score: 100% | 2026-02-14T12:48:43.452781

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))