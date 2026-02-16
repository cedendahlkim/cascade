# Task: gen-dict-char_count-3188 | Score: 100% | 2026-02-15T12:30:09.887199

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))