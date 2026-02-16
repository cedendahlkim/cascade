# Task: gen-strv-anagram-6492 | Score: 100% | 2026-02-14T12:28:28.969250

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')