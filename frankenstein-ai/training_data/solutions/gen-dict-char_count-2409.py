# Task: gen-dict-char_count-2409 | Score: 100% | 2026-02-13T16:47:51.893871

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))