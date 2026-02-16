# Task: gen-dict-char_count-8246 | Score: 100% | 2026-02-13T20:01:40.635995

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))