# Task: gen-dict-char_count-1985 | Score: 100% | 2026-02-15T07:53:44.315257

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))