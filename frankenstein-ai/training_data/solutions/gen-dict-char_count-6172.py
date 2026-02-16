# Task: gen-dict-char_count-6172 | Score: 100% | 2026-02-15T13:29:46.049244

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))