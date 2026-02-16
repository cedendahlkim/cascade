# Task: gen-dict-char_count-3450 | Score: 100% | 2026-02-13T14:42:21.400889

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))