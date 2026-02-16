# Task: gen-dict-char_count-3949 | Score: 100% | 2026-02-15T10:29:15.749699

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))