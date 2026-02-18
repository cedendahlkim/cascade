# Task: gen-dict-char_count-1872 | Score: 100% | 2026-02-17T20:03:21.655641

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))