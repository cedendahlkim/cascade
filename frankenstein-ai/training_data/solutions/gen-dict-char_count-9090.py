# Task: gen-dict-char_count-9090 | Score: 100% | 2026-02-13T11:03:58.113622

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))