# Task: gen-strv-compress-3059 | Score: 100% | 2026-02-13T21:48:46.424996

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))