# Task: gen-dict-char_count-7543 | Score: 100% | 2026-02-15T10:09:41.014912

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))