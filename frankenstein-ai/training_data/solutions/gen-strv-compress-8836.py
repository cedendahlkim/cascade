# Task: gen-strv-compress-8836 | Score: 100% | 2026-02-13T13:46:48.919188

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))