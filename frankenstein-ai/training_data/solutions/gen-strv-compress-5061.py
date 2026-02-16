# Task: gen-strv-compress-5061 | Score: 100% | 2026-02-13T18:30:00.434544

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))