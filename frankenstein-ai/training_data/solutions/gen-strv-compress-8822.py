# Task: gen-strv-compress-8822 | Score: 100% | 2026-02-13T20:33:08.449119

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))