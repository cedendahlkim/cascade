# Task: gen-strv-anagram-8031 | Score: 100% | 2026-02-13T12:35:38.513978

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')