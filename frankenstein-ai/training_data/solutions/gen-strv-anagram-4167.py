# Task: gen-strv-anagram-4167 | Score: 100% | 2026-02-13T14:19:02.995439

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')