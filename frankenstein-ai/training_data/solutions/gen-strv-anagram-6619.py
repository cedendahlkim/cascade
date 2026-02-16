# Task: gen-strv-anagram-6619 | Score: 100% | 2026-02-13T18:50:26.722210

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')