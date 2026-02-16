# Task: gen-strv-compress-8401 | Score: 100% | 2026-02-14T12:28:45.187087

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))