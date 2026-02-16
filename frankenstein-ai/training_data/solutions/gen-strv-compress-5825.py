# Task: gen-strv-compress-5825 | Score: 100% | 2026-02-13T11:54:47.811951

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))