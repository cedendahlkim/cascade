# Task: gen-dict-char_count-4336 | Score: 100% | 2026-02-15T13:00:27.712652

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))