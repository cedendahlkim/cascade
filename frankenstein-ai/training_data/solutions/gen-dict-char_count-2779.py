# Task: gen-dict-char_count-2779 | Score: 100% | 2026-02-13T21:48:52.857334

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))