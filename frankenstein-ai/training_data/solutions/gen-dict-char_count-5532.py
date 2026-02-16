# Task: gen-dict-char_count-5532 | Score: 100% | 2026-02-15T08:24:26.150170

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))