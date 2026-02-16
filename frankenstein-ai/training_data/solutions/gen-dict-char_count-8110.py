# Task: gen-dict-char_count-8110 | Score: 100% | 2026-02-15T13:59:51.703316

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))