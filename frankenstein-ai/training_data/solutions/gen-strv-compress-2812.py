# Task: gen-strv-compress-2812 | Score: 100% | 2026-02-13T21:27:13.713417

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))