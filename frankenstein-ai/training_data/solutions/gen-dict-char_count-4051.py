# Task: gen-dict-char_count-4051 | Score: 100% | 2026-02-15T07:45:49.182460

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))