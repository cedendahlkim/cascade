# Task: gen-strv-compress-1065 | Score: 100% | 2026-02-13T09:17:07.499608

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))