# Task: gen-strv-compress-4578 | Score: 100% | 2026-02-13T21:08:26.150847

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))