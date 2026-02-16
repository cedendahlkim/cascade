# Task: gen-strv-compress-4798 | Score: 100% | 2026-02-13T21:49:35.276963

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))