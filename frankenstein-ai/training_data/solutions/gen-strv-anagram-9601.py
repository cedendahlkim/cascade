# Task: gen-strv-anagram-9601 | Score: 100% | 2026-02-13T09:17:01.498136

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')