# Task: gen-dict-char_count-2362 | Score: 100% | 2026-02-15T14:00:00.895210

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))