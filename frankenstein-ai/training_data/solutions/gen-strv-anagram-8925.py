# Task: gen-strv-anagram-8925 | Score: 100% | 2026-02-13T18:37:36.921284

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')