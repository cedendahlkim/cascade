# Task: gen-dict-char_count-4942 | Score: 100% | 2026-02-13T11:03:59.981338

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))