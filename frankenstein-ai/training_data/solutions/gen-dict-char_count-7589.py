# Task: gen-dict-char_count-7589 | Score: 100% | 2026-02-13T09:22:41.401113

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))