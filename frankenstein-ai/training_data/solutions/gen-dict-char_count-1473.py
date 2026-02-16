# Task: gen-dict-char_count-1473 | Score: 100% | 2026-02-14T12:13:35.653601

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))