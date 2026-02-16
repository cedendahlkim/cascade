# Task: gen-dict-char_count-9473 | Score: 100% | 2026-02-13T19:05:37.549169

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))