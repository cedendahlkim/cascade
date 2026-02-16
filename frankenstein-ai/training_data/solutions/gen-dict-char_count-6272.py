# Task: gen-dict-char_count-6272 | Score: 100% | 2026-02-13T11:03:17.162920

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))