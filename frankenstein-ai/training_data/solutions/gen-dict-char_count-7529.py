# Task: gen-dict-char_count-7529 | Score: 100% | 2026-02-15T08:05:37.712931

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))