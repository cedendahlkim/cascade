# Task: gen-strv-compress-5167 | Score: 100% | 2026-02-13T19:47:50.921040

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))