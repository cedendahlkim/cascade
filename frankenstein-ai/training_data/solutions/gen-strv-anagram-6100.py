# Task: gen-strv-anagram-6100 | Score: 100% | 2026-02-15T09:50:36.622046

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')