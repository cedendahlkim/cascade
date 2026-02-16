# Task: gen-strv-compress-9963 | Score: 100% | 2026-02-13T14:01:37.705476

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))