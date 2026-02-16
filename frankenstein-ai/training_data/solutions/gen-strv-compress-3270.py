# Task: gen-strv-compress-3270 | Score: 100% | 2026-02-13T09:20:45.081685

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))