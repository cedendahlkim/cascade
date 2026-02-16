# Task: gen-strv-compress-2749 | Score: 100% | 2026-02-13T21:28:05.758247

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))