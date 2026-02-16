# Task: gen-strv-compress-9837 | Score: 100% | 2026-02-13T21:48:48.799307

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))