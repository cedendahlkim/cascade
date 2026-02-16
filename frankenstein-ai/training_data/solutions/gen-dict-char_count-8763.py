# Task: gen-dict-char_count-8763 | Score: 100% | 2026-02-14T12:03:07.969614

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))