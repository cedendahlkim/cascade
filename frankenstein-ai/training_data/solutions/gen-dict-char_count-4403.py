# Task: gen-dict-char_count-4403 | Score: 100% | 2026-02-13T18:28:53.111918

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))